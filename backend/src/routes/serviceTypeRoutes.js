const express = require('express');
const router = express.Router();
const {
  getServiceTypes,
  getActiveServiceTypes,
  getServiceTypeById,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   GET /api/service-types/active
router.get('/active', getActiveServiceTypes);

// @route   GET /api/service-types
router.get('/', getServiceTypes);

// @route   POST /api/service-types
router.post('/', createServiceType);

// @route   GET /api/service-types/:id
router.get('/:id', getServiceTypeById);

// @route   PUT /api/service-types/:id
router.put('/:id', updateServiceType);

// @route   DELETE /api/service-types/:id
router.delete('/:id', deleteServiceType);

module.exports = router;
