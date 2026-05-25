const mongoose = require('mongoose');

/**
 * Gestion de repuesto solicitado a APA para continuar una reparacion.
 */
const gestionRepuestoSchema = new mongoose.Schema({
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
  tecnicoSolicitanteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El tecnico solicitante es requerido']
  },
  asistenteResponsableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  descripcionRepuesto: {
    type: String,
    required: [true, 'La descripcion del repuesto es requerida'],
    trim: true
  },
  cantidad: {
    type: Number,
    default: 1,
    min: 1
  },
  motivoSolicitud: {
    type: String,
    required: [true, 'El motivo de solicitud es requerido'],
    trim: true
  },
  solicitudCompleta: {
    type: Boolean,
    default: false
  },
  cotizacionSolicitada: {
    type: Boolean,
    default: false
  },
  proveedor: {
    type: String,
    default: 'APA',
    trim: true
  },
  disponibleApa: {
    type: Boolean,
    default: false
  },
  precioCotizado: {
    type: Number,
    default: 0,
    min: 0
  },
  ordenCompraSap: {
    type: String,
    trim: true
  },
  facturaApa: {
    type: String,
    trim: true
  },
  cantidadRecibida: {
    type: Number,
    default: 0,
    min: 0
  },
  repuestoValidado: {
    type: Boolean,
    default: false
  },
  facturaValidada: {
    type: Boolean,
    default: false
  },
  costoRegistrado: {
    type: Number,
    default: 0,
    min: 0
  },
  entregadoTecnico: {
    type: Boolean,
    default: false
  },
  tecnicoRecibeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  diferencias: {
    type: String,
    trim: true
  },
  estadoRepuesto: {
    type: String,
    enum: [
      'pendiente_repuesto',
      'pendiente_cotizacion',
      'repuesto_solicitado_apa',
      'repuesto_disponible',
      'en_excepcion'
    ],
    default: 'pendiente_repuesto'
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
  collection: 'gestiones_repuesto',
  timestamps: false
});

gestionRepuestoSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();
});

const GestionRepuesto = mongoose.model('GestionRepuesto', gestionRepuestoSchema);

module.exports = GestionRepuesto;
