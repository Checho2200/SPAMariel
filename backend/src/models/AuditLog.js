const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Puede ser null si el usuario no est谩 logueado
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: false,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
