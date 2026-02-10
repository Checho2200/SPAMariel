const mongoose = require('mongoose');

const clientSchema = mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: ['DNI', 'RUC', 'CE'],
      required: [true, 'El tipo de documento es requerido'],
      default: 'DNI',
    },
    documentNumber: {
      type: String,
      required: [true, 'El número de documento es requerido'],
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'El apellido paterno es requerido'],
      trim: true,
    },
    secondLastName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
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

// Virtual: Nombre completo
clientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName} ${this.secondLastName}`.trim();
});

// Asegurar que los virtuals se incluyan en JSON
clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);
