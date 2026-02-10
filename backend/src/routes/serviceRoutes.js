const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   GET /api/services
router.get('/', getServices);

// @route   POST /api/services
router.post('/', createService);

// @route   GET /api/services/:id
router.get('/:id', getServiceById);

// @route   PUT /api/services/:id
router.put('/:id', updateService);

// @route   DELETE /api/services/:id
router.delete('/:id', deleteService);

module.exports = router;
