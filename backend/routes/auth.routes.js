const express = require('express');
const Usuario = require('../models/user.model');
const { buildSafeAuthUser } = require('../services/authUser.service');
const { signAuthToken } = require('../services/jwt.service');

const router = express.Router();

/**
 * Endpoint real de autenticacion para el login del frontend.
 *
 * @remarks
 * Valida usuario y contrasena contra MongoDB usando el hash PBKDF2 del modelo
 * `Usuario`. Devuelve un JWT firmado sin exponer `passwordHash`.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, usuario, password } = req.body;
    const normalizedUsername = String(username || usuario || '').trim().toLowerCase();

    if (!normalizedUsername || !password) {
      return res.status(400).json({ error: 'Usuario y contrasena son requeridos' });
    }

    const user = await Usuario.findOne({
      username: normalizedUsername,
      activo: true,
    });

    if (!user || !user.comparePassword(password)) {
      return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
    }

    const safeUser = await buildSafeAuthUser(user);
    const token = signAuthToken(safeUser);

    res.status(200).json({
      message: 'Inicio de sesion exitoso',
      user: safeUser,
      token,
      sessionMode: 'jwt',
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo iniciar sesion' });
  }
});

module.exports = router;
