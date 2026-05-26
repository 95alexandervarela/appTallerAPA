const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la recepcion inicial de equipos.
 *
 * @remarks
 * Representa el registro que se crea cuando un cliente, sucursal o area interna
 * entrega un equipo antes de que el taller lo tome para diagnostico.
 */
const recepcionEquipoSchema = new mongoose.Schema({
  numeroCaso: {
    type: String,
    required: [true, 'El numero de caso es requerido'],
    unique: true,
    trim: true
  },
  origenEquipo: {
    type: String,
    required: [true, 'El origen del equipo es requerido'],
    enum: [
      'cliente_final',
      'sucursal',
      'ventas',
      'garantia',
      'traslado_interno',
      'area_apa',
      'otro'
    ]
  },
  nombreCliente: {
    type: String,
    required: [true, 'El nombre del cliente o contacto es requerido'],
    trim: true
  },
  telefonoCliente: {
    type: String,
    required: [true, 'El telefono del cliente o contacto es requerido'],
    trim: true
  },
  correoCliente: {
    type: String,
    trim: true,
    lowercase: true
  },
  sucursalOrigen: {
    type: String,
    trim: true
  },
  tipoEquipo: {
    type: String,
    required: [true, 'El tipo de equipo es requerido'],
    trim: true
  },
  marcaEquipo: {
    type: String,
    trim: true
  },
  modeloEquipo: {
    type: String,
    trim: true
  },
  serieEquipo: {
    type: String,
    trim: true
  },
  fallaReportada: {
    type: String,
    required: [true, 'La falla reportada es requerida'],
    trim: true
  },
  condicionFisica: {
    type: String,
    required: [true, 'La condicion fisica inicial es requerida'],
    trim: true
  },
  accesoriosEntregados: {
    type: [String],
    default: []
  },
  datosCompletos: {
    type: Boolean,
    default: false
  },
  esCasoEspecial: {
    type: Boolean,
    default: false
  },
  motivoCasoEspecial: {
    type: String,
    trim: true
  },
  ingresoAutorizado: {
    type: Boolean,
    default: true
  },
  motivoRechazo: {
    type: String,
    trim: true
  },
  referenciaSap: {
    type: String,
    trim: true
  },
  comprobanteEntregado: {
    type: Boolean,
    default: false
  },
  equipoEtiquetado: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  },
  estadoRecepcion: {
    type: String,
    enum: ['registrado', 'en_diagnostico', 'equipo_no_ingresado'],
    default: 'registrado'
  },
  recibidoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario que recibe el equipo es requerido']
  },
  autorizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaIngreso: {
    type: Date,
    default: Date.now
  },
  fechaEnvioTaller: {
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
  collection: 'recepciones_equipo',
  timestamps: false
});

recepcionEquipoSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();
});

const RecepcionEquipo = mongoose.model('RecepcionEquipo', recepcionEquipoSchema);

module.exports = RecepcionEquipo;
