const mongoose = require('mongoose');

/**
 * Validacion de garantia o autorizacion previa a reparacion.
 */
const validacionGarantiaSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'El ticket es requerido']
  },
  diagnosticoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticoTecnico'
  },
  numeroCaso: {
    type: String,
    required: [true, 'El numero de caso es requerido'],
    trim: true
  },
  tipoValidacion: {
    type: String,
    enum: ['garantia', 'autorizacion_cliente', 'gerencia', 'caso_especial'],
    required: [true, 'El tipo de validacion es requerido']
  },
  responsableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  clienteInformado: {
    type: Boolean,
    default: false
  },
  antecedenteVenta: {
    type: String,
    trim: true
  },
  condicionesGarantia: {
    type: String,
    trim: true
  },
  costoTotalReparacion: {
    type: Number,
    default: 0,
    min: 0
  },
  requiereRepuesto: {
    type: Boolean,
    default: false
  },
  repuestoRequerido: {
    type: String,
    trim: true
  },
  decisionGarantia: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada', 'no_aplica'],
    default: 'pendiente'
  },
  decisionCliente: {
    type: String,
    enum: ['pendiente', 'autoriza', 'rechaza', 'no_aplica'],
    default: 'pendiente'
  },
  decisionGerencia: {
    type: String,
    enum: ['pendiente', 'aprueba', 'rechaza', 'no_requiere'],
    default: 'no_requiere'
  },
  motivoDecision: {
    type: String,
    trim: true
  },
  evidenciaAutorizacion: {
    type: String,
    trim: true
  },
  estadoValidacion: {
    type: String,
    enum: [
      'pendiente_informacion',
      'pendiente_autorizacion_garantia',
      'garantia_aprobada',
      'reparacion_autorizada',
      'reparacion_no_autorizada',
      'pendiente_repuesto',
      'pendiente_cobro_cierre',
      'listo_reparacion'
    ],
    default: 'pendiente_autorizacion_garantia'
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
  collection: 'validaciones_garantia',
  timestamps: false
});

validacionGarantiaSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();
});

const ValidacionGarantia = mongoose.model('ValidacionGarantia', validacionGarantiaSchema);

module.exports = ValidacionGarantia;
