const mongoose = require('mongoose');

/**
 * Esquema de Mongoose para la coleccion de Roles.
 *
 * @remarks
 * Define los perfiles base del sistema de taller. El campo `codigo` se usa como
 * identificador legible y unico para evitar depender de ObjectIds quemados en el frontend.
 */
const roleSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: [true, 'El codigo del rol es requerido'],
    unique: true,
    trim: true,
    lowercase: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del rol es requerido'],
    trim: true
  },
  permisos: {
    type: [String],
    default: []
  },
  activo: {
    type: Boolean,
    default: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_actualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'roles',
  timestamps: false
});

roleSchema.pre('save', function () {
  this.fecha_actualizacion = Date.now();
});

const Rol = mongoose.model('Rol', roleSchema);

module.exports = Rol;
