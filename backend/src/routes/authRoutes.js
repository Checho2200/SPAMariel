const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const loginLimiter = require('../middleware/loginLimiter');

router.post('/register', protect, admin, registerUser);
router.post('/login', loginLimiter, loginUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
