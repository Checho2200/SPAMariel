const asyncHandler = require('express-async-handler');
const ServiceType = require('../models/ServiceType');
const Service = require('../models/Service');
const { logAction } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

// ════════════════════════════════════════════════════════
//  TIPOS DE SERVICIO
// ════════════════════════════════════════════════════════

// @desc    Get all service types (paginated)
// @route   GET /api/service-types?page=1&limit=10&search=
// @access  Private
const getServiceTypes = asyncHandler(async (req, res) => {
  const result = await paginate(ServiceType, {
    query: req.query,
    searchFields: ['name', 'description'],
  });
  res.json(result);
});

// @desc    Get all active service types (for selects)
// @route   GET /api/service-types/active
// @access  Private
const getActiveServiceTypes = asyncHandler(async (req, res) => {
  const types = await ServiceType.find({ isActive: true }).sort({ name: 1 });
  res.json(types);
});

// @desc    Get service type by ID
// @route   GET /api/service-types/:id
// @access  Private
const getServiceTypeById = asyncHandler(async (req, res) => {
  const serviceType = await ServiceType.findById(req.params.id);

  if (serviceType) {
    res.json(serviceType);
  } else {
    res.status(404);
    throw new Error('Tipo de servicio no encontrado');
  }
});

// @desc    Create service type
// @route   POST /api/service-types
// @access  Private
const createServiceType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('El nombre es requerido');
  }

  const exists = await ServiceType.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (exists) {
    res.status(400);
    throw new Error('Ya existe un tipo de servicio con ese nombre');
  }

  const serviceType = await ServiceType.create({ name, description });

  logAction(req, 'SERVICE_TYPE_CREATE', `Tipo de servicio creado: ${serviceType.name}`);

  res.status(201).json(serviceType);
});

// @desc    Update service type
// @route   PUT /api/service-types/:id
// @access  Private
const updateServiceType = asyncHandler(async (req, res) => {
  const serviceType = await ServiceType.findById(req.params.id);

  if (!serviceType) {
    res.status(404);
    throw new Error('Tipo de servicio no encontrado');
  }

  const { name, description, isActive } = req.body;

  if (name && name !== serviceType.name) {
    const exists = await ServiceType.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: serviceType._id },
    });
    if (exists) {
      res.status(400);
      throw new Error('Ya existe un tipo de servicio con ese nombre');
    }
    serviceType.name = name;
  }

  if (description !== undefined) serviceType.description = description;
  if (isActive !== undefined) serviceType.isActive = isActive;

  const updated = await serviceType.save();

  logAction(req, 'SERVICE_TYPE_UPDATE', `Tipo de servicio actualizado: ${updated.name}`);

  res.json(updated);
});

// @desc    Delete service type
// @route   DELETE /api/service-types/:id
// @access  Private
const deleteServiceType = asyncHandler(async (req, res) => {
  const serviceType = await ServiceType.findById(req.params.id);

  if (!serviceType) {
    res.status(404);
    throw new Error('Tipo de servicio no encontrado');
  }

  // Verificar que no tenga servicios asociados
  const serviceCount = await Service.countDocuments({ serviceType: serviceType._id });
  if (serviceCount > 0) {
    res.status(400);
    throw new Error(`No se puede eliminar, tiene ${serviceCount} servicio(s) asociado(s)`);
  }

  await serviceType.deleteOne();

  logAction(req, 'SERVICE_TYPE_DELETE', `Tipo de servicio eliminado: ${serviceType.name}`);

  res.json({ message: 'Tipo de servicio eliminado correctamente' });
});

// ════════════════════════════════════════════════════════
//  SERVICIOS
// ════════════════════════════════════════════════════════

// @desc    Get all services (paginated)
// @route   GET /api/services?page=1&limit=10&search=
// @access  Private
const getServices = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const search = (req.query.search || '').trim();

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Service.countDocuments(filter);
  const data = await Service.find(filter)
    .populate('serviceType', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Private
const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('serviceType', 'name');

  if (service) {
    res.json(service);
  } else {
    res.status(404);
    throw new Error('Servicio no encontrado');
  }
});

// @desc    Create service
// @route   POST /api/services
// @access  Private
const createService = asyncHandler(async (req, res) => {
  const { name, description, serviceType, duration, price } = req.body;

  if (!name || !serviceType || !duration || price === undefined) {
    res.status(400);
    throw new Error('Nombre, tipo, duración y precio son requeridos');
  }

  // Verificar que el tipo exista
  const typeExists = await ServiceType.findById(serviceType);
  if (!typeExists) {
    res.status(400);
    throw new Error('Tipo de servicio no válido');
  }

  const service = await Service.create({ name, description, serviceType, duration, price });

  // Populate para devolver con el nombre del tipo
  const populated = await service.populate('serviceType', 'name');

  logAction(req, 'SERVICE_CREATE', `Servicio creado: ${service.name}`);

  res.status(201).json(populated);
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error('Servicio no encontrado');
  }

  const { name, description, serviceType, duration, price, isActive } = req.body;

  if (name !== undefined) service.name = name;
  if (description !== undefined) service.description = description;
  if (duration !== undefined) service.duration = duration;
  if (price !== undefined) service.price = price;
  if (isActive !== undefined) service.isActive = isActive;

  if (serviceType !== undefined) {
    const typeExists = await ServiceType.findById(serviceType);
    if (!typeExists) {
      res.status(400);
      throw new Error('Tipo de servicio no válido');
    }
    service.serviceType = serviceType;
  }

  const updated = await service.save();
  const populated = await updated.populate('serviceType', 'name');

  logAction(req, 'SERVICE_UPDATE', `Servicio actualizado: ${updated.name}`);

  res.json(populated);
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error('Servicio no encontrado');
  }

  await service.deleteOne();

  logAction(req, 'SERVICE_DELETE', `Servicio eliminado: ${service.name}`);

  res.json({ message: 'Servicio eliminado correctamente' });
});

module.exports = {
  getServiceTypes,
  getActiveServiceTypes,
  getServiceTypeById,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
