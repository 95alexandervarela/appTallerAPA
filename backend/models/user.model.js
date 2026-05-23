const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Esquema de Mongoose para la colección de Usuarios.
 *
 * @remarks
 * Este esquema representa la estructura de persistencia para los usuarios del Help Desk,
 * modelado a partir de la clase `Usuario` del diagrama UML del sistema.
 * Configura índices únicos para `username` y `email` para prevenir duplicados.
 *
 * @type {mongoose.Schema}
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, ingrese un correo válido']
  },
  passwordHash: {
    type: String,
    required: [true, 'La contraseña es requerida']
  },
  nombre_completo: {
    type: String,
    required: [true, 'El nombre completo es requerido'],
    trim: true
  },
  rol_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rol',
    required: [true, 'El ID de rol es requerido']
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
  },
  fecha_eliminacion: {
    type: Date,
    default: null
  }
}, {
  collection: 'users',
  timestamps: false // Manejados manualmente por requerimiento específico de nombres en español
});

/**
 * Middleware pre-save de Mongoose para procesar la contraseña del usuario.
 *
 * @remarks
 * Si la contraseña (`passwordHash`) fue modificada o es nueva, la hashea utilizando
 * el algoritmo PBKDF2 y una sal aleatoria de 16 bytes generada por el módulo `crypto` de Node.js.
 * Además, actualiza automáticamente la fecha de actualización (`fecha_actualizacion`).
 *
 * @async
 * @function
 * @returns {Promise<void>}
 */
userSchema.pre('save', async function () {
  const user = this;

  // Actualizar siempre la fecha de actualización al guardar
  user.fecha_actualizacion = Date.now();

  // Hashear solo si la contraseña ha sido modificada (o es nueva)
  if (!user.isModified('passwordHash')) {
    return;
  }

  // Si la contraseña no está hasheada previamente (ej. no contiene el separador ':')
  if (user.passwordHash && !user.passwordHash.includes(':')) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(user.passwordHash, salt, 10000, 64, 'sha512').toString('hex');
    user.passwordHash = `${salt}:${hash}`;
  }
});

/**
 * Middleware pre-find de Mongoose para filtrar registros eliminados lógicamente (Soft Delete).
 *
 * @remarks
 * Intercepta todas las consultas que comiencen con `find` (como `find`, `findOne`, `findOneAndUpdate`)
 * y les añade una condición para excluir aquellos documentos que contengan una fecha en `fecha_eliminacion`.
 *
 * @function
 * @this {mongoose.Query}
 */
userSchema.pre(/^find/, function () {
  // Solo buscar usuarios activos (fecha_eliminacion igual a null)
  this.where({ fecha_eliminacion: null });
});

/**
 * Compara una contraseña candidata en texto plano con el hash almacenado.
 *
 * @remarks
 * Extrae la sal del hash guardado en base de datos y recalcula el hash de la contraseña
 * candidata utilizando PBKDF2 (10,000 iteraciones) para verificar la coincidencia.
 *
 * @param {string} candidatePassword - Contraseña en texto plano proporcionada por el usuario.
 * @returns {boolean} `true` si la contraseña coincide con la almacenada, `false` en caso contrario.
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  try {
    const parts = this.passwordHash.split(':');
    if (parts.length !== 2) {
      return false; // Hash mal formado
    }
    const [salt, storedHash] = parts;
    const hash = crypto.pbkdf2Sync(candidatePassword, salt, 10000, 64, 'sha512').toString('hex');
    return storedHash === hash;
  } catch (error) {
    return false;
  }
};

const Usuario = mongoose.model('Usuario', userSchema);

module.exports = Usuario;
