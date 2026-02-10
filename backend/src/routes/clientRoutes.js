const express = require('express');
const router = express.Router();
const {
  consultarDocumento,
  consultarEmpresa,
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Consultas externas (Decolecta API)
// @route   GET /api/clients/consulta/dni/:numero
router.get('/consulta/dni/:numero', consultarDocumento);

// @route   GET /api/clients/consulta/ruc/:numero
router.get('/consulta/ruc/:numero', consultarEmpresa);

// CRUD
// @route   GET /api/clients
router.get('/', getClients);

// @route   POST /api/clients
router.post('/', createClient);

// @route   GET /api/clients/:id
router.get('/:id', getClientById);

// @route   PUT /api/clients/:id
router.put('/:id', updateClient);

// @route   DELETE /api/clients/:id
router.delete('/:id', deleteClient);

module.exports = router;
