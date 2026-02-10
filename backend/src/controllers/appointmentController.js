const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Service = require('../models/Service');
const { logAction } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

// ─── Helper: calcular endTime desde startTime + duración ──
const calcEndTime = (startTime, durationMinutes) => {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const endM = (totalMin % 60).toString().padStart(2, '0');
  return `${endH}:${endM}`;
};

// ─── Helper: construir rango de día completo en UTC ──────
const getDayRangeUTC = (dateStr) => {
  const d = typeof dateStr === 'string' ? dateStr.split('T')[0] : new Date(dateStr).toISOString().split('T')[0];
  return {
    start: new Date(`${d}T00:00:00.000Z`),
    end: new Date(`${d}T23:59:59.999Z`),
  };
};

// ─── Helper: verificar traslape de horarios ───────────────
const checkOverlap = async (date, startTime, endTime, excludeId = null) => {
  const { start: dayStart, end: dayEnd } = getDayRangeUTC(date);

  const filter = {
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ['cancelada', 'no-asistio'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return Appointment.findOne(filter);
};

// @desc    Get appointments (paginated, with filters)
// @route   GET /api/appointments?page=1&limit=10&search=&status=&date=
// @access  Private
const getAppointments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const search = (req.query.search || '').trim();
  const statusFilter = req.query.status || '';

  const filter = {};

  if (statusFilter) {
    filter.status = statusFilter;
  }

  // Filtrar por fecha específica
  if (req.query.date) {
    const { start: dayStart, end: dayEnd } = getDayRangeUTC(req.query.date);
    filter.date = { $gte: dayStart, $lte: dayEnd };
  }

  let total, data;

  if (search) {
    // Buscar por nombre de cliente → necesitamos pipeline
    const clients = await Client.find({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    const clientIds = clients.map((c) => c._id);
    filter.$or = [{ client: { $in: clientIds } }];
  }

  total = await Appointment.countDocuments(filter);
  data = await Appointment.find(filter)
    .populate('client', 'firstName lastName documentNumber phone')
    .populate({ path: 'service', select: 'name duration price', populate: { path: 'serviceType', select: 'name' } })
    .sort({ date: -1, startTime: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

// @desc    Get appointments for calendar (by date range)
// @route   GET /api/appointments/calendar?start=2026-02-01&end=2026-02-28
// @access  Private
const getCalendarAppointments = asyncHandler(async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    res.status(400);
    throw new Error('Se requieren fechas de inicio y fin');
  }

  const startDate = new Date(`${start.split('T')[0]}T00:00:00.000Z`);
  const endDate = new Date(`${end.split('T')[0]}T23:59:59.999Z`);

  const appointments = await Appointment.find({
    date: { $gte: startDate, $lte: endDate },
    status: { $nin: ['cancelada'] },
    isPaid: true,
  })
    .populate('client', 'firstName lastName phone')
    .populate('service', 'name duration')
    .sort({ date: 1, startTime: 1 });

  // Formatear para FullCalendar
  const events = appointments.map((apt) => {
    const dateStr = apt.date.toISOString().split('T')[0];
    return {
      id: apt._id,
      title: `${apt.client?.firstName || ''} ${apt.client?.lastName || ''} - ${apt.service?.name || ''}`,
      start: `${dateStr}T${apt.startTime}:00`,
      end: `${dateStr}T${apt.endTime}:00`,
      backgroundColor: getStatusColor(apt.status),
      borderColor: getStatusColor(apt.status),
      extendedProps: {
        status: apt.status,
        clientName: `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`,
        serviceName: apt.service?.name || '',
        duration: apt.service?.duration || 0,
        phone: apt.client?.phone || '',
      },
    };
  });

  res.json(events);
});

// Colores por estado
function getStatusColor(status) {
  const colors = {
    pendiente: '#f59e0b',
    confirmada: '#3b82f6',
    'en-progreso': '#8b5cf6',
    completada: '#10b981',
    cancelada: '#ef4444',
    'no-asistio': '#6b7280',
  };
  return colors[status] || '#6b7280';
}

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('client', 'firstName lastName documentNumber phone email')
    .populate({ path: 'service', select: 'name duration price', populate: { path: 'serviceType', select: 'name' } });

  if (appointment) {
    res.json(appointment);
  } else {
    res.status(404);
    throw new Error('Cita no encontrada');
  }
});

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = asyncHandler(async (req, res) => {
  const { client, service, date, startTime, notes } = req.body;

  if (!client || !service || !date || !startTime) {
    res.status(400);
    throw new Error('Cliente, servicio, fecha y hora son requeridos');
  }

  // Verificar cliente
  const clientDoc = await Client.findById(client);
  if (!clientDoc) {
    res.status(400);
    throw new Error('Cliente no válido');
  }

  // Verificar servicio y obtener duración/precio
  const serviceDoc = await Service.findById(service);
  if (!serviceDoc) {
    res.status(400);
    throw new Error('Servicio no válido');
  }

  const endTime = calcEndTime(startTime, serviceDoc.duration);
  const price = serviceDoc.price;

  // Verificar que no haya traslape
  const overlap = await checkOverlap(date, startTime, endTime);
  if (overlap) {
    res.status(400);
    throw new Error(`Ya existe una cita en ese horario (${overlap.startTime} - ${overlap.endTime})`);
  }

  const appointment = await Appointment.create({
    client,
    service,
    date,
    startTime,
    endTime,
    price,
    notes,
  });

  const populated = await appointment.populate([
    { path: 'client', select: 'firstName lastName documentNumber phone' },
    { path: 'service', select: 'name duration price', populate: { path: 'serviceType', select: 'name' } },
  ]);

  logAction(req, 'APPOINTMENT_CREATE', `Cita creada: ${clientDoc.firstName} ${clientDoc.lastName} - ${serviceDoc.name} el ${date}`);

  res.status(201).json(populated);
});

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Cita no encontrada');
  }

  const { client, service, date, startTime, status, notes } = req.body;

  if (client !== undefined) {
    const clientDoc = await Client.findById(client);
    if (!clientDoc) { res.status(400); throw new Error('Cliente no válido'); }
    appointment.client = client;
  }

  if (service !== undefined) {
    const serviceDoc = await Service.findById(service);
    if (!serviceDoc) { res.status(400); throw new Error('Servicio no válido'); }
    appointment.service = service;
    appointment.price = serviceDoc.price;

    // Recalcular endTime
    const st = startTime || appointment.startTime;
    appointment.endTime = calcEndTime(st, serviceDoc.duration);
  }

  if (date !== undefined) appointment.date = date;

  if (startTime !== undefined) {
    appointment.startTime = startTime;
    // Recalcular endTime con la duración del servicio actual
    const serviceDoc = await Service.findById(appointment.service);
    if (serviceDoc) {
      appointment.endTime = calcEndTime(startTime, serviceDoc.duration);
    }
  }

  if (status !== undefined) appointment.status = status;
  if (notes !== undefined) appointment.notes = notes;

  // Verificar traslape si cambió fecha/hora
  if (date !== undefined || startTime !== undefined) {
    const overlap = await checkOverlap(
      appointment.date,
      appointment.startTime,
      appointment.endTime,
      appointment._id
    );
    if (overlap) {
      res.status(400);
      throw new Error(`Ya existe una cita en ese horario (${overlap.startTime} - ${overlap.endTime})`);
    }
  }

  const updated = await appointment.save();
  const populated = await updated.populate([
    { path: 'client', select: 'firstName lastName documentNumber phone' },
    { path: 'service', select: 'name duration price', populate: { path: 'serviceType', select: 'name' } },
  ]);

  logAction(req, 'APPOINTMENT_UPDATE', `Cita actualizada: ${populated.client?.firstName} - ${populated.service?.name}`);

  res.json(populated);
});

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Cita no encontrada');
  }

  const { status } = req.body;
  const validStatuses = ['pendiente', 'confirmada', 'en-progreso', 'completada', 'cancelada', 'no-asistio'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Estado no válido');
  }

  appointment.status = status;
  const updated = await appointment.save();

  const populated = await updated.populate([
    { path: 'client', select: 'firstName lastName documentNumber phone' },
    { path: 'service', select: 'name duration price', populate: { path: 'serviceType', select: 'name' } },
  ]);

  logAction(req, 'APPOINTMENT_STATUS', `Estado de cita cambiado a: ${status}`);

  res.json(populated);
});

// @desc    Confirm payment for appointment
// @route   PATCH /api/appointments/:id/pay
// @access  Private
const confirmPayment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Cita no encontrada');
  }

  const { paymentMethod } = req.body;

  if (!paymentMethod) {
    res.status(400);
    throw new Error('El método de pago es requerido');
  }

  appointment.isPaid = true;
  appointment.paymentMethod = paymentMethod;
  appointment.paidAt = new Date();
  appointment.status = 'confirmada';

  const updated = await appointment.save();
  const populated = await updated.populate([
    { path: 'client', select: 'firstName lastName documentNumber phone' },
    { path: 'service', select: 'name duration price', populate: { path: 'serviceType', select: 'name' } },
  ]);

  logAction(req, 'APPOINTMENT_PAYMENT', `Pago confirmado: ${populated.client?.firstName} - ${populated.service?.name} (${paymentMethod})`);

  res.json(populated);
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Cita no encontrada');
  }

  await appointment.deleteOne();

  logAction(req, 'APPOINTMENT_DELETE', `Cita eliminada`);

  res.json({ message: 'Cita eliminada correctamente' });
});

module.exports = {
  getAppointments,
  getCalendarAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  confirmPayment,
  deleteAppointment,
};
