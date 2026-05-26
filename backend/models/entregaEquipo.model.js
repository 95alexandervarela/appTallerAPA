const mongoose = require('mongoose');

/**
 * Entrega del equipo al cliente y cierre del caso.
 */
const entregaEquipoSchema = new mongoose.Schema({
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
  cobroFacturacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CobroFacturacion'
  },
  facturaComprobante: {
    type: String,
    trim: true
  },
  facturaValida: {
    type: Boolean,
    default: false
  },
  pagoConfirmado: {
    type: Boolean,
    default: false
  },
  validadoConCaja: {
    type: Boolean,
    default: false
  },
  equipoCorresponde: {
    type: Boolean,
    default: false
  },
  accesoriosEntregados: {
    type: [String],
    default: []
  },
  clienteAceptaEntrega: {
    type: Boolean,
    default: false
  },
  observacionesCliente: {
    type: String,
    trim: true
  },
  requiereExcepcion: {
    type: Boolean,
    default: false
  },
  responsableExcepcionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  facturaMarcadaEntregada: {
    type: Boolean,
    default: false
  },
  llamadaServicioCerradaSap: {
    type: Boolean,
    default: false
  },
  documentacionArchivada: {
    type: Boolean,
    default: false
  },
  recibidoPorCliente: {
    type: String,
    trim: true
  },
  documentoCliente: {
    type: String,
    trim: true
  },
  entregadoPorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  estadoEntrega: {
    type: String,
    enum: ['listo_entrega', 'pendiente_cobro_entrega', 'en_excepcion', 'entregado', 'cerrado'],
    default: 'listo_entrega'
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaEntrega: {
    type: Date,
    default: null
  },
  fechaCierre: {
    type: Date,
    default: null
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
  collection: 'entregas_equipo',
  timestamps: false
});

entregaEquipoSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();

  if (this.estadoEntrega === 'entregado' && !this.fechaEntrega) {
    this.fechaEntrega = Date.now();
  }

  if (this.estadoEntrega === 'cerrado' && !this.fechaCierre) {
    this.fechaCierre = Date.now();
  }
});

const EntregaEquipo = mongoose.model('EntregaEquipo', entregaEquipoSchema);

module.exports = EntregaEquipo;
