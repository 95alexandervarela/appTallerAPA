const Usuario = require("../models/user.model");
const Rol = require("../models/role.model");

const DEFAULT_SYSTEM_PASSWORD = "Sistemas*2026";

const SYSTEM_USER = {
  username: "sistemas",
  email: "sistemas@app.com",
  nombre_completo: "Usuario Sistemas",
  activo: true,
};

/**
 * Crea o normaliza el usuario master local `sistemas` en entornos de desarrollo.
 *
 * @remarks
 * Este bootstrap evita que un clon nuevo quede bloqueado por una base MongoDB
 * vacia. Solo corre fuera de produccion y puede desactivarse con
 * `AUTO_BOOTSTRAP_SYSTEM_USER=false`.
 *
 * @returns {Promise<void>} Promesa de sincronizacion del usuario local.
 */
async function ensureLocalSystemUser() {
  const isProduction = process.env.NODE_ENV === "production";
  const disabled = process.env.AUTO_BOOTSTRAP_SYSTEM_USER === "false";

  if (isProduction || disabled) {
    return;
  }

  const password = process.env.SISTEMAS_BOOTSTRAP_PASSWORD || DEFAULT_SYSTEM_PASSWORD;

  let managerRole = await Rol.findOne({ codigo: "manager" });

  if (!managerRole) {
    managerRole = new Rol({
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
    await managerRole.save();
  }

  let user = await Usuario.findOne({ username: SYSTEM_USER.username });
  let changed = false;

  if (!user) {
    user = new Usuario({
      ...SYSTEM_USER,
      rol_id: managerRole._id,
    });
    user.setPassword(password);
    changed = true;
  } else {
    if (user.email !== SYSTEM_USER.email) {
      user.email = SYSTEM_USER.email;
      changed = true;
    }

    if (user.nombre_completo !== SYSTEM_USER.nombre_completo) {
      user.nombre_completo = SYSTEM_USER.nombre_completo;
      changed = true;
    }

    if (String(user.rol_id) !== String(managerRole._id)) {
      user.rol_id = managerRole._id;
      changed = true;
    }

    if (!user.activo) {
      user.activo = true;
      changed = true;
    }

    if (!user.comparePassword(password)) {
      user.setPassword(password);
      changed = true;
    }
  }

  if (changed) {
    await user.save();
    console.log("[Bootstrap] Usuario sistemas listo para desarrollo local.");
    return;
  }

  console.log("[Bootstrap] Usuario sistemas ya estaba configurado.");
}

module.exports = {
  ensureLocalSystemUser,
};
