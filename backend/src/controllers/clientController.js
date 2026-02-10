const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const { consultarDNI, consultarRUC } = require('../services/decolectaService');
const { logAction } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

// @desc    Consultar DNI en RENIEC (Decolecta)
// @route   GET /api/clients/consulta/dni/:numero
// @access  Private
const consultarDocumento = asyncHandler(async (req, res) => {
  const { numero } = req.params;

  const data = await consultarDNI(numero);

  res.json({
    documentType: 'DNI',
    documentNumber: data.document_number,
    firstName: data.first_name,
    lastName: data.first_last_name,
    secondLastName: data.second_last_name,
    fullName: data.full_name,
  });
});

// @desc    Consultar RUC en SUNAT (Decolecta)
// @route   GET /api/clients/consulta/ruc/:numero
// @access  Private
const consultarEmpresa = asyncHandler(async (req, res) => {
  const { numero } = req.params;

  const data = await consultarRUC(numero);

  res.json({
    documentType: 'RUC',
    documentNumber: data.numero_documento,
    razonSocial: data.razon_social,
    estado: data.estado,
    condicion: data.condicion,
    direccion: data.direccion,
    distrito: data.distrito,
    provincia: data.provincia,
    departamento: data.departamento,
  });
});

// @desc    Get all clients (paginated)
// @route   GET /api/clients?page=1&limit=10&search=
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const result = await paginate(Client, {
    query: req.query,
    searchFields: ['firstName', 'lastName', 'documentNumber', 'email', 'phone'],
  });
  res.json(result);
});

// @desc    Get client by ID
// @route   GET /api/clients/:id
// @access  Private
const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (client) {
    res.json(client);
  } else {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }
});

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const {
    documentType,
    documentNumber,
    firstName,
    lastName,
    secondLastName,
    email,
    phone,
    address,
    notes,
  } = req.body;

  // Validación
  if (!documentNumber || !firstName || !lastName) {
    res.status(400);
    throw new Error('Documento, nombre y apellido son requeridos');
  }

  // Verificar si ya existe
  const exists = await Client.findOne({ documentNumber });
  if (exists) {
    res.status(400);
    throw new Error('Ya existe un cliente con ese número de documento');
  }

  const client = await Client.create({
    documentType: documentType || 'DNI',
    documentNumber,
    firstName,
    lastName,
    secondLastName: secondLastName || '',
    email: email || '',
    phone: phone || '',
    address: address || '',
    notes: notes || '',
  });

  // Audit Log
  logAction(
    { ...req, user: req.user },
    'CLIENT_CREATE',
    `User ${req.user.email} created client ${client.documentNumber} - ${client.firstName} ${client.lastName}`
  );

  res.status(201).json(client);
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }

  const {
    documentType,
    documentNumber,
    firstName,
    lastName,
    secondLastName,
    email,
    phone,
    address,
    notes,
    isActive,
  } = req.body;

  // Validación
  if (!firstName || !lastName) {
    res.status(400);
    throw new Error('Nombre y apellido son requeridos');
  }

  // Verificar duplicados si cambió el documento
  if (documentNumber && documentNumber !== client.documentNumber) {
    const exists = await Client.findOne({ documentNumber });
    if (exists) {
      res.status(400);
      throw new Error('Ya existe un cliente con ese número de documento');
    }
  }

  // Actualizar campos
  client.documentType = documentType || client.documentType;
  client.documentNumber = documentNumber || client.documentNumber;
  client.firstName = firstName;
  client.lastName = lastName;
  client.secondLastName = secondLastName !== undefined ? secondLastName : client.secondLastName;
  client.email = email !== undefined ? email : client.email;
  client.phone = phone !== undefined ? phone : client.phone;
  client.address = address !== undefined ? address : client.address;
  client.notes = notes !== undefined ? notes : client.notes;
  if (isActive !== undefined) client.isActive = isActive;

  const updatedClient = await client.save();

  // Audit Log
  logAction(
    { ...req, user: req.user },
    'CLIENT_UPDATE',
    `User ${req.user.email} updated client ${updatedClient.documentNumber}`
  );

  res.json(updatedClient);
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }

  await Client.findByIdAndDelete(req.params.id);

  // Audit Log
  logAction(
    { ...req, user: req.user },
    'CLIENT_DELETE',
    `User ${req.user.email} deleted client ${client.documentNumber} - ${client.firstName} ${client.lastName}`
  );

  res.json({ message: 'Cliente eliminado correctamente' });
});

module.exports = {
  consultarDocumento,
  consultarEmpresa,
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
