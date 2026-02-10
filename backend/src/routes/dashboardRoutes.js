const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getTodaySummary,
  getClientHistory,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

// @route   GET /api/dashboard/today
router.get('/today', getTodaySummary);

// @route   GET /api/dashboard/client-history/:clientId
router.get('/client-history/:clientId', getClientHistory);

module.exports = router;
