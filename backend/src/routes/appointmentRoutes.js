const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getCalendarAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  confirmPayment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route   GET /api/appointments/calendar?start=&end=
router.get('/calendar', getCalendarAppointments);

// @route   GET /api/appointments
router.get('/', getAppointments);

// @route   POST /api/appointments
router.post('/', createAppointment);

// @route   GET /api/appointments/:id
router.get('/:id', getAppointmentById);

// @route   PUT /api/appointments/:id
router.put('/:id', updateAppointment);

// @route   PATCH /api/appointments/:id/status
router.patch('/:id/status', updateAppointmentStatus);

// @route   PATCH /api/appointments/:id/pay
router.patch('/:id/pay', confirmPayment);

// @route   DELETE /api/appointments/:id
router.delete('/:id', deleteAppointment);

module.exports = router;
