const mongoose = require('mongoose');

const repuestoSugeridoSchema = new mongoose.Schema({
  descripcion: { type: String, trim: true },
  cantidad: { type: Number, default: 1, min: 1 },
  motivo: { type: String, trim: true }
}, { _id: false });

/**
 * Diagnostico tecnico realizado por el tecnico asignado al ticket.
 */
const diagnosticoTecnicoSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'El ticket es requerido']
  },
  numeroCaso: {
    type: String,
    required: [true, 'El numero de caso es requerido'],
    trim: true
  },
  tecnicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El tecnico que reviso es requerido']
  },
  asistenteTecnicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fallaReportada: {
    type: String,
    required: [true, 'La falla reportada es requerida'],
    trim: true
  },
  fallaEncontrada: {
    type: String,
    trim: true
  },
  causaProbable: {
    type: String,
    trim: true
  },
  pruebasRealizadas: {
    type: [String],
    default: []
  },
  repuestoRequerido: {
    type: Boolean,
    default: false
  },
  repuestosSugeridos: {
    type: [repuestoSugeridoSchema],
    default: []
  },
  requiereGarantiaAutorizacion: {
    type: Boolean,
    default: false
  },
  reparable: {
    type: Boolean,
    default: true
  },
  costoEstimado: {
    type: Number,
    default: 0,
    min: 0
  },
  observaciones: {
    type: String,
    trim: true
  },
  resultadoDiagnostico: {
    type: String,
    enum: [
      'falla_no_reproducida',
      'diagnosticado',
      'no_reparable',
      'requiere_autorizacion',
      'requiere_repuesto',
      'listo_reparacion'
    ],
    default: 'diagnosticado'
  },
  registradoEnSap: {
    type: Boolean,
    default: false
  },
  referenciaSap: {
    type: String,
    trim: true
  },
  estadoDiagnostico: {
    type: String,
    enum: ['en_diagnostico', 'diagnosticado', 'en_excepcion'],
    default: 'en_diagnostico'
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  fechaEliminacion: {
    type: Date,
    default: null
  }
}, {
  collection: 'diagnosticos_tecnicos',
  timestamps: false
});

diagnosticoTecnicoSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();
});

const DiagnosticoTecnico = mongoose.model('DiagnosticoTecnico', diagnosticoTecnicoSchema);

module.exports = DiagnosticoTecnico;
