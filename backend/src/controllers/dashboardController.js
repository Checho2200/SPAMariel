const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Service = require('../models/Service');

// Helper: construir rango UTC de un día
const getDayRangeUTC = (dateStr) => {
  const d = typeof dateStr === 'string' ? dateStr.split('T')[0] : new Date(dateStr).toISOString().split('T')[0];
  return {
    start: new Date(`${d}T00:00:00.000Z`),
    end: new Date(`${d}T23:59:59.999Z`),
  };
};

// Helper: inicio y fin de semana/mes
const getWeekRange = () => {
  const now = new Date();
  const day = now.getUTCDay(); // 0=dom
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
};

// @desc    Get dashboard KPIs (real data)
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const week = getWeekRange();
  const month = getMonthRange();
  const today = getDayRangeUTC(new Date().toISOString());

  // ─── Ejecutar todas las queries en paralelo ──────────
  const [
    totalClients,
    activeClients,
    newClientsMonth,
    totalAppointmentsMonth,
    completedMonth,
    cancelledMonth,
    revenueMonthResult,
    totalAppointmentsWeek,
    completedWeek,
    revenueWeekResult,
    appointmentsToday,
    topServicesMonth,
    appointmentsByStatus,
    revenueByWeekday,
  ] = await Promise.all([
    // Clientes
    Client.countDocuments(),
    Client.countDocuments({ isActive: true }),
    Client.countDocuments({ createdAt: { $gte: month.start, $lte: month.end } }),

    // Citas del mes
    Appointment.countDocuments({ date: { $gte: month.start, $lte: month.end } }),
    Appointment.countDocuments({ date: { $gte: month.start, $lte: month.end }, status: 'completada' }),
    Appointment.countDocuments({ date: { $gte: month.start, $lte: month.end }, status: 'cancelada' }),
    Appointment.aggregate([
      { $match: { date: { $gte: month.start, $lte: month.end }, status: { $in: ['completada', 'en-progreso', 'confirmada', 'pendiente'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),

    // Citas de la semana
    Appointment.countDocuments({ date: { $gte: week.start, $lte: week.end } }),
    Appointment.countDocuments({ date: { $gte: week.start, $lte: week.end }, status: 'completada' }),
    Appointment.aggregate([
      { $match: { date: { $gte: week.start, $lte: week.end }, status: { $in: ['completada', 'en-progreso', 'confirmada', 'pendiente'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),

    // Citas de hoy
    Appointment.countDocuments({ date: { $gte: today.start, $lte: today.end } }),

    // Top 5 servicios más solicitados del mes
    Appointment.aggregate([
      { $match: { date: { $gte: month.start, $lte: month.end }, status: { $nin: ['cancelada'] } } },
      { $group: { _id: '$service', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceInfo',
        },
      },
      { $unwind: '$serviceInfo' },
      {
        $project: {
          name: '$serviceInfo.name',
          count: 1,
          revenue: 1,
        },
      },
    ]),

    // Citas por estado del mes
    Appointment.aggregate([
      { $match: { date: { $gte: month.start, $lte: month.end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Ingresos por día de la semana (últimas 4 semanas)
    Appointment.aggregate([
      {
        $match: {
          date: { $gte: month.start, $lte: month.end },
          status: { $in: ['completada', 'en-progreso', 'confirmada', 'pendiente'] },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' }, // 1=dom, 2=lun...7=sab
          total: { $sum: '$price' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const revenueMonth = revenueMonthResult[0]?.total || 0;
  const revenueWeek = revenueWeekResult[0]?.total || 0;

  // Tasa de completitud
  const completionRateMonth = totalAppointmentsMonth > 0
    ? Math.round((completedMonth / totalAppointmentsMonth) * 100)
    : 0;

  const cancellationRateMonth = totalAppointmentsMonth > 0
    ? Math.round((cancelledMonth / totalAppointmentsMonth) * 100)
    : 0;

  // Formato de status distribution
  const statusMap = {};
  appointmentsByStatus.forEach((s) => { statusMap[s._id] = s.count; });

  // Formato de revenue by weekday
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const weekdayRevenue = dayNames.map((name, i) => {
    const entry = revenueByWeekday.find((r) => r._id === i + 1);
    return { day: name, revenue: entry?.total || 0, appointments: entry?.count || 0 };
  });

  res.json({
    clients: {
      total: totalClients,
      active: activeClients,
      newThisMonth: newClientsMonth,
    },
    appointments: {
      month: {
        total: totalAppointmentsMonth,
        completed: completedMonth,
        cancelled: cancelledMonth,
        completionRate: completionRateMonth,
        cancellationRate: cancellationRateMonth,
      },
      week: {
        total: totalAppointmentsWeek,
        completed: completedWeek,
      },
      today: appointmentsToday,
    },
    revenue: {
      month: revenueMonth,
      week: revenueWeek,
    },
    topServices: topServicesMonth,
    statusDistribution: statusMap,
    weekdayRevenue,
  });
});

// @desc    Get today's appointments summary (resumen del día)
// @route   GET /api/dashboard/today
// @access  Private
const getTodaySummary = asyncHandler(async (req, res) => {
  const today = getDayRangeUTC(new Date().toISOString());

  const appointments = await Appointment.find({
    date: { $gte: today.start, $lte: today.end },
    status: { $nin: ['cancelada'] },
  })
    .populate('client', 'firstName lastName documentNumber phone')
    .populate('service', 'name duration price')
    .sort({ startTime: 1 });

  // Totales del día
  const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const uniqueClients = [...new Set(appointments.map((a) => a.client?._id?.toString()))].length;
  const completed = appointments.filter((a) => a.status === 'completada').length;
  const pending = appointments.filter((a) => ['pendiente', 'confirmada'].includes(a.status)).length;
  const inProgress = appointments.filter((a) => a.status === 'en-progreso').length;

  res.json({
    appointments,
    summary: {
      totalAppointments: appointments.length,
      uniqueClients,
      totalRevenue,
      completed,
      pending,
      inProgress,
    },
  });
});

// @desc    Get appointment history for a specific client
// @route   GET /api/dashboard/client-history/:clientId
// @access  Private
const getClientHistory = asyncHandler(async (req, res) => {
  const { clientId } = req.params;

  const client = await Client.findById(clientId);
  if (!client) {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }

  const appointments = await Appointment.find({ client: clientId })
    .populate('service', 'name duration price')
    .sort({ date: -1, startTime: -1 });

  // Estadísticas del cliente
  const totalVisits = appointments.length;
  const completedVisits = appointments.filter((a) => a.status === 'completada').length;
  const totalSpent = appointments
    .filter((a) => a.status !== 'cancelada' && a.status !== 'no-asistio')
    .reduce((sum, a) => sum + (a.price || 0), 0);
  const lastVisit = appointments.find((a) => a.status === 'completada');
  const cancelledCount = appointments.filter((a) => a.status === 'cancelada').length;
  const noShowCount = appointments.filter((a) => a.status === 'no-asistio').length;

  // Servicios más usados
  const serviceCount = {};
  appointments.forEach((a) => {
    if (a.service && a.status !== 'cancelada') {
      const name = a.service.name;
      serviceCount[name] = (serviceCount[name] || 0) + 1;
    }
  });
  const topServices = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  res.json({
    client: {
      _id: client._id,
      firstName: client.firstName,
      lastName: client.lastName,
      documentNumber: client.documentNumber,
      phone: client.phone,
      email: client.email,
    },
    stats: {
      totalVisits,
      completedVisits,
      totalSpent,
      lastVisit: lastVisit?.date || null,
      cancelledCount,
      noShowCount,
    },
    topServices,
    appointments,
  });
});

module.exports = {
  getDashboardStats,
  getTodaySummary,
  getClientHistory,
};
