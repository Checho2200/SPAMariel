const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'El cliente es requerido'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'El servicio es requerido'],
    },
    date: {
      type: Date,
      required: [true, 'La fecha es requerida'],
    },
    startTime: {
      type: String, // "09:00"
      required: [true, 'La hora de inicio es requerida'],
    },
    endTime: {
      type: String, // "10:30"
      required: [true, 'La hora de fin es requerida'],
    },
    status: {
      type: String,
      enum: ['pendiente', 'confirmada', 'en-progreso', 'completada', 'cancelada', 'no-asistio'],
      default: 'pendiente',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: [0, 'El precio no puede ser negativo'],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia', ''],
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para evitar doble reserva en el mismo horario
appointmentSchema.index({ date: 1, startTime: 1, endTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
