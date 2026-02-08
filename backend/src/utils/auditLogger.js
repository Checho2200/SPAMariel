const AuditLog = require('../models/AuditLog');
const asyncHandler = require('express-async-handler');

/**
 * Registra una acci贸n en la base de datos de auditor铆a.
 * @param {Object} req - Objeto de solicitud Express
 * @param {String} action - Descripci贸n corta de la acci贸n
 * @param {String} details - Detalles adicionales (opcional)
 */
const logAction = async (req, action, details = '') => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const user = req.user ? req.user._id : null;

    await AuditLog.create({
      user,
      action,
      details,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // No lanzamos error para no interrumpir el flujo principal
  }
};

module.exports = { logAction };
