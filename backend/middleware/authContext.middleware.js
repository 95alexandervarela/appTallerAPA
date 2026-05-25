const Usuario = require('../models/user.model');
const { buildSafeAuthUser } = require('../services/authUser.service');

/**
 * Carga el usuario autenticado desde la cabecera temporal `x-user-id`.
 *
 * @remarks
 * Es un puente controlado hasta implementar JWT. Valida que el usuario exista,
 * este activo y resuelve su rol real antes de permitir operaciones protegidas.
 *
 * @param {import('express').Request} req - Peticion entrante.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {import('express').NextFunction} next - Siguiente middleware.
 * @returns {Promise<void>}
 */
const requireAuthContext = async (req, res, next) => {
  try {
    const userId = req.get('x-user-id');

    if (!userId) {
      return res.status(401).json({ error: 'Sesion requerida' });
    }

    const user = await Usuario.findOne({ _id: userId, activo: true });

    if (!user) {
      return res.status(401).json({ error: 'Usuario autenticado no valido' });
    }

    req.authUser = await buildSafeAuthUser(user);
    req.authUserDocument = user;

    next();
  } catch (error) {
    res.status(401).json({ error: 'No se pudo validar la sesion' });
  }
};

/**
 * Restringe una ruta a roles especificos ya resueltos por `requireAuthContext`.
 *
 * @param {string[]} allowedRoleCodes - Codigos de rol permitidos.
 * @returns {import('express').RequestHandler} Middleware de autorizacion.
 */
const requireRole = (allowedRoleCodes) => (req, res, next) => {
  if (!req.authUser || !allowedRoleCodes.includes(req.authUser.roleCode)) {
    return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
  }

  next();
};

module.exports = {
  requireAuthContext,
  requireRole,
};
