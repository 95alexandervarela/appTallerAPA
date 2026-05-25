const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para los tickets de taller.
 *
 * @remarks
 * Un ticket nace desde una recepcion de equipo ya registrada. Recepcion controla
 * el ingreso fisico del equipo; Ticket controla la asignacion y seguimiento tecnico.
 */
const ticketSchema = new mongoose.Schema({
  numeroTicket: {
    type: String,
    required: [true, 'El numero de ticket es requerido'],
    unique: true,
    trim: true
  },
  recepcionEquipoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecepcionEquipo',
    required: [true, 'La recepcion de equipo es requerida']
  },
  numeroCasoRecepcion: {
    type: String,
    required: [true, 'El numero de caso de recepcion es requerido'],
    trim: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario que crea el ticket es requerido']
  },
  tecnicoAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  estadoTicket: {
    type: String,
    enum: [
      'creado',
      'asignado',
      'en_diagnostico',
      'diagnostico',
      'diagnosticado',
      'en_reparacion',
      'pendiente_aprobacion',
      'pendiente_autorizacion_garantia',
      'garantia_aprobada',
      'reparacion_autorizada',
      'reparacion_no_autorizada',
      'listo_reparacion',
      'pendiente_repuesto',
      'espera_repuesto',
      'pendiente_cotizacion',
      'repuesto_solicitado_apa',
      'repuesto_disponible',
      'listo_para_reparacion',
      'reparado_servicio_finalizado',
      'validado_tecnicamente',
      'listo_cobro_entrega',
      'pendiente_cliente',
      'pendiente_cobro_cierre',
      'listo_entrega',
      'pendiente_cobro_entrega',
      'entregado',
      'en_excepcion',
      'cerrado',
      'cancelado'
    ],
    default: 'creado'
  },
  nombreCliente: {
    type: String,
    required: [true, 'El nombre del cliente es requerido'],
    trim: true
  },
  telefonoCliente: {
    type: String,
    required: [true, 'El telefono del cliente es requerido'],
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
    trim: true
  },
  accesoriosEntregados: {
    type: [String],
    default: []
  },
  diagnosticoInicial: {
    type: String,
    trim: true
  },
  observacionesAsignacion: {
    type: String,
    trim: true
  },
  fechaAsignacion: {
    type: Date
  },
  fechaInicioDiagnostico: {
    type: Date
  },
  fechaCierre: {
    type: Date
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
  }
}, {
  collection: 'tickets_taller',
  timestamps: false
});

ticketSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();

  if (this.isModified('tecnicoAsignado') && this.tecnicoAsignado && !this.fechaAsignacion) {
    this.fechaAsignacion = Date.now();
  }

  if (this.tecnicoAsignado && this.estadoTicket === 'creado') {
    this.estadoTicket = 'asignado';
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
