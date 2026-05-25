const Rol = require('../models/role.model');

const LEGACY_ROLE_FALLBACKS = {
  '6a126c9296a6e0cb6e9df8a3': {
    codigo: 'administrador',
    nombre: 'Administrador',
  },
  '6a126c9296a6e0cb6e9df8a4': {
    codigo: 'tecnico',
    nombre: 'Tecnico',
  },
};

/**
 * Resuelve el rol operativo de un usuario sin depender solo del ObjectId.
 *
 * @remarks
 * Primero intenta leer el documento real de `roles`. Si la base todavia usa
 * roles historicos hardcodeados, aplica un fallback temporal para no romper el
 * login ni los permisos mientras se normaliza la coleccion de roles.
 *
 * @param {import('../models/user.model')} user - Usuario activo de MongoDB.
 * @returns {Promise<{id: string, codigo: string, nombre: string}>} Rol resuelto para autorizacion.
 */
const resolveUserRole = async (user) => {
  const roleId = String(user.rol_id || '');
  const fallbackRole = LEGACY_ROLE_FALLBACKS[roleId];

  try {
    const role = await Rol.findOne({ _id: user.rol_id, activo: true });

    if (role) {
      return {
        id: String(role._id),
        codigo: role.codigo,
        nombre: role.nombre,
      };
    }
  } catch (error) {
    // Si el rol no existe en la coleccion nueva, el fallback conserva compatibilidad.
  }

  return {
    id: roleId,
    codigo: fallbackRole?.codigo || 'desconocido',
    nombre: fallbackRole?.nombre || 'Desconocido',
  };
};

/**
 * Construye el usuario seguro que viaja al frontend y a los middlewares.
 *
 * @remarks
 * Nunca incluye `passwordHash`. Este objeto es la base de la sesion temporal
 * hasta migrar a JWT real con firma y expiracion.
 *
 * @param {import('../models/user.model')} user - Documento de usuario autenticado.
 * @returns {Promise<object>} Usuario minimo de sesion sin datos sensibles.
 */
const buildSafeAuthUser = async (user) => {
  const role = await resolveUserRole(user);

  return {
    id: String(user._id),
    username: user.username,
    name: user.nombre_completo,
    email: user.email,
    role: role.nombre,
    roleCode: role.codigo,
    roleId: role.id,
  };
};

module.exports = {
  LEGACY_ROLE_FALLBACKS,
  buildSafeAuthUser,
  resolveUserRole,
};
