const mongoose = require('mongoose');

const serviceTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ServiceType = mongoose.model('ServiceType', serviceTypeSchema);

module.exports = ServiceType;
