const jwt = require('jsonwebtoken');

/**
 * Servicio centralizado para firmar y validar JWT de autenticacion.
 *
 * @remarks
 * El token contiene solo datos minimos de sesion. Nunca debe incluir
 * passwordHash ni informacion sensible del usuario.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no configurado');
  }

  return secret;
}

function signAuthToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    roleCode: user.roleCode,
    roleId: user.roleId,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
