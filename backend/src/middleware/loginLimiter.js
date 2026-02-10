const rateLimit = require('express-rate-limit');
const { logAction } = require('../utils/auditLogger'); // Optional: Log when limit is reached

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 intentos por IP
  message: {
    message: 'Demasiados intentos de inicio de sesi贸n desde esta IP, por favor intente de nuevo despu茅s de 15 minutos',
  },
  handler: (req, res, next, options) => {
    logAction(req, 'LOGIN_RateLimit', `IP ${req.ip} blocked due to too many login attempts`);
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
