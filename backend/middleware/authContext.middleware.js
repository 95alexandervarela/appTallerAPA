const Usuario = require('../models/user.model');
const { buildSafeAuthUser } = require('../services/authUser.service');
const { verifyAuthToken } = require('../services/jwt.service');

/**
 * Carga el usuario autenticado desde JWT o desde la cabecera temporal `x-user-id`.
 *
 * @remarks
 * JWT es la via principal. `x-user-id` queda como fallback temporal para no
 * romper el frontend mientras se migra a Authorization: Bearer.
 *
 * @param {import('express').Request} req - Peticion entrante.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {import('express').NextFunction} next - Siguiente middleware.
 * @returns {Promise<void>}
 */
const requireAuthContext = async (req, res, next) => {
  try {
    const authorization = req.get('authorization') || '';
    const bearerPrefix = 'Bearer ';
    let userId = req.get('x-user-id');
    let sessionMode = 'legacy-x-user-id';

    if (authorization.startsWith(bearerPrefix)) {
      const token = authorization.slice(bearerPrefix.length).trim();
      const decoded = verifyAuthToken(token);
      userId = decoded.sub;
      sessionMode = 'jwt';
    }

    if (!userId) {
      return res.status(401).json({ error: 'Sesion requerida' });
    }

    const user = await Usuario.findOne({ _id: userId, activo: true });

    if (!user) {
      return res.status(401).json({ error: 'Usuario autenticado no valido' });
    }

    req.authUser = await buildSafeAuthUser(user);
    req.authUser.sessionMode = sessionMode;
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
  const managerCanUseAdminRoute =
    req.authUser?.roleCode === 'manager' && allowedRoleCodes.includes('administrador');

  if (!req.authUser || (!allowedRoleCodes.includes(req.authUser.roleCode) && !managerCanUseAdminRoute)) {
    return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
  }

  next();
};

module.exports = {
  requireAuthContext,
  requireRole,
};
