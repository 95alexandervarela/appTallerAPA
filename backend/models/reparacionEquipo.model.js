const mongoose = require('mongoose');

const repuestoUtilizadoSchema = new mongoose.Schema({
  gestionRepuestoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GestionRepuesto'
  },
  descripcion: { type: String, trim: true },
  cantidad: { type: Number, default: 1, min: 1 },
  costo: { type: Number, default: 0, min: 0 }
}, { _id: false });

/**
 * Registro operativo de la reparacion y validacion tecnica del equipo.
 */
const reparacionEquipoSchema = new mongoose.Schema({
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
    required: [true, 'El tecnico es requerido']
  },
  asistenteTecnicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  autorizadoParaReparar: {
    type: Boolean,
    default: false
  },
  repuestoEntregado: {
    type: Boolean,
    default: false
  },
  repuestosUtilizados: {
    type: [repuestoUtilizadoSchema],
    default: []
  },
  actividadRealizada: {
    type: String,
    trim: true
  },
  resultadoReparacion: {
    type: String,
    trim: true
  },
  nuevaFallaDetectada: {
    type: String,
    trim: true
  },
  requiereNuevaAutorizacion: {
    type: Boolean,
    default: false
  },
  pruebaRealizada: {
    type: String,
    trim: true
  },
  validacionTecnicaAprobada: {
    type: Boolean,
    default: false
  },
  fallaValidacion: {
    type: String,
    trim: true
  },
  estadoReparacion: {
    type: String,
    enum: [
      'listo_reparacion',
      'en_reparacion',
      'pausada_pendiente_autorizacion',
      'pausada_pendiente_repuesto',
      'en_excepcion',
      'reparado_servicio_finalizado',
      'validado_tecnicamente'
    ],
    default: 'listo_reparacion'
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaInicio: {
    type: Date
  },
  fechaFinalizacion: {
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
  collection: 'reparaciones_equipo',
  timestamps: false
});

reparacionEquipoSchema.pre('save', function () {
  this.fechaActualizacion = Date.now();

  if (this.estadoReparacion === 'en_reparacion' && !this.fechaInicio) {
    this.fechaInicio = Date.now();
  }

  if (
    ['reparado_servicio_finalizado', 'validado_tecnicamente'].includes(this.estadoReparacion)
    && !this.fechaFinalizacion
  ) {
    this.fechaFinalizacion = Date.now();
  }
});

const ReparacionEquipo = mongoose.model('ReparacionEquipo', reparacionEquipoSchema);

module.exports = ReparacionEquipo;
