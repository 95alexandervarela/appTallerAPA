/**
 * Script controlado para crear o normalizar el usuario Manager "sistemas".
 *
 * Uso:
 * SISTEMAS_TEMP_PASSWORD=<password> node backend/scripts/createSistemaUser.js
 *
 * La contraseña no se guarda en el código. El hash se genera con Usuario#setPassword.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Usuario = require("../models/user.model");
const Rol = require("../models/role.model");

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/appTallerAPA";
const SISTEMAS_PASSWORD = process.env.SISTEMAS_TEMP_PASSWORD;

const SISTEMAS_USER = {
  username: "sistemas",
  email: "sistemas@app.com",
  nombre_completo: "Usuario Sistemas",
  activo: true,
};

if (!SISTEMAS_PASSWORD) {
  console.error("Error: SISTEMAS_TEMP_PASSWORD no está configurado");
  console.error(
    "Uso: SISTEMAS_TEMP_PASSWORD=<password> node backend/scripts/createSistemaUser.js",
  );
  process.exit(1);
}

async function createSistemaUser() {
  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Conectado a MongoDB");

    let rolManager = await Rol.findOne({ codigo: "manager" });

    if (!rolManager) {
      rolManager = new Rol({
        codigo: "manager",
        nombre: "Manager",
        permisos: [
          "usuarios:gestionar",
          "roles:gestionar",
          "ordenes:gestionar",
          "sistema:superusuario",
        ],
        activo: true,
      });
      await rolManager.save();
      console.log(`Rol manager creado: ${rolManager._id}`);
    }

    if (!rolManager.activo) {
      throw new Error('Rol "manager" no está activo');
    }

    let usuario = await Usuario.findOne({ username: SISTEMAS_USER.username });

    if (!usuario) {
      usuario = new Usuario({
        ...SISTEMAS_USER,
        rol_id: rolManager._id,
      });
      usuario.setPassword(SISTEMAS_PASSWORD);
      await usuario.save();
      console.log(`Usuario ${SISTEMAS_USER.username} creado: ${usuario._id}`);
    } else {
      let changed = false;

      if (usuario.email !== SISTEMAS_USER.email) {
        usuario.email = SISTEMAS_USER.email;
        changed = true;
      }

      if (usuario.nombre_completo !== SISTEMAS_USER.nombre_completo) {
        usuario.nombre_completo = SISTEMAS_USER.nombre_completo;
        changed = true;
      }

      if (String(usuario.rol_id) !== String(rolManager._id)) {
        usuario.rol_id = rolManager._id;
        changed = true;
      }

      if (!usuario.activo) {
        usuario.activo = true;
        changed = true;
      }

      if (!usuario.comparePassword(SISTEMAS_PASSWORD)) {
        usuario.setPassword(SISTEMAS_PASSWORD);
        changed = true;
      }

      if (changed) {
        await usuario.save();
        console.log(`Usuario ${SISTEMAS_USER.username} actualizado`);
      } else {
        console.log(`Usuario ${SISTEMAS_USER.username} ya estaba correcto`);
      }
    }

    const usuarioValidado = await Usuario.findOne({
      username: SISTEMAS_USER.username,
      activo: true,
    });

    if (!usuarioValidado) {
      throw new Error("No se pudo validar el usuario sistemas activo");
    }

    if (String(usuarioValidado.rol_id) !== String(rolManager._id)) {
      throw new Error("El usuario sistemas no quedó con rol manager");
    }

    if (!usuarioValidado.comparePassword(SISTEMAS_PASSWORD)) {
      throw new Error("El password del usuario sistemas no quedó válido");
    }

    console.log("Validación final correcta");
    console.log(`Usuario: ${usuarioValidado.username}`);
    console.log(`Email: ${usuarioValidado.email}`);
    console.log(`Rol código: ${rolManager.codigo}`);
    console.log(`Activo: ${usuarioValidado.activo}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  }
}

createSistemaUser();
