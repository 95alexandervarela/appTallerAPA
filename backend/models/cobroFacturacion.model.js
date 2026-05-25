const mongoose = require('mongoose');

/**
 * Aviso al cliente, cobro y facturacion del caso de servicio.
 */
const cobroFacturacionSchema = new mongoose.Schema({
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
  recepcionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecepcionEquipo'
  },
  avisadoCliente: {
    type: Boolean,
    default: false
  },
  medioAviso: {
    type: String,
    enum: ['llamada', 'whatsapp', 'correo', 'presencial', 'otro'],
    default: 'llamada'
  },
  clienteConfirmaLlegada: {
    type: Boolean,
    default: false
  },
  aplicaCobro: {
    type: Boolean,
    default: true
  },
  diagnosticoMonto: {
    type: Number,
    default: 0,
    min: 0
  },
  manoObraMonto: {
    type: Number,
    default: 0,
    min: 0
  },
  repuestosMonto: {
    type: Number,
    default: 0,
    min: 0
  },
  otrosCargos: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCobro: {
    type: Number,
    default: 0,
    min: 0
  },
  motivoNoCobro: {
    type: String,
    trim: true
  },
  ordenVentaSap: {
    type: String,
    trim: true
  },
  facturaSap: {
    type: String,
    trim: true
  },
  medioPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'otro', 'no_aplica'],
    default: 'no_aplica'
  },
  pagoConfirmado: {
    type: Boolean,
    default: false
  },
  copiaFacturaFirmada: {
    type: Boolean,
    default: false
  },
  cajaNotificoRecepcion: {
    type: Boolean,
    default: false
  },
  estadoCobro: {
    type: String,
    enum: ['listo_cobro_entrega', 'pendiente_cliente', 'pendiente_cobro_cierre', 'listo_entrega'],
    default: 'listo_cobro_entrega'
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaAviso: {
    type: Date
  },
  fechaPago: {
    type: Date
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
  collection: 'cobros_facturacion',
  timestamps: false
});

cobroFacturacionSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();
  this.totalCobro = this.diagnosticoMonto + this.manoObraMonto + this.repuestosMonto + this.otrosCargos;

  if (this.avisadoCliente && !this.fechaAviso) {
    this.fechaAviso = Date.now();
  }

  if (this.pagoConfirmado && !this.fechaPago) {
    this.fechaPago = Date.now();
  }
});

const CobroFacturacion = mongoose.model('CobroFacturacion', cobroFacturacionSchema);

module.exports = CobroFacturacion;
