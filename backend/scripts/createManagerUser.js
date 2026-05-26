/**
 * Script temporal para crear usuario Manager gvarela
 *
 * Uso:
 * node backend/scripts/createManagerUser.js
 *
 * El script es idempotente:
 * - Si el rol manager no existe, lo crea
 * - Si el usuario gvarela no existe, lo crea
 * - Si existe, lo actualiza para asegurar rol manager activo
 *
 * ⚠️  IMPORTANTE:
 * - Este script NO contiene contraseña hardcodeada
 * - La contraseña se lee de variables de entorno
 * - Después de ejecutar, cambiar la contraseña en el primer ingreso
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Usuario = require("../models/user.model");
const Rol = require("../models/role.model");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/appTallerAPA";
const MANAGER_USERNAME = process.env.MANAGER_USERNAME || "gvarela";
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || "gvarela@almacenpajaroazul.com";
const MANAGER_FULLNAME = process.env.MANAGER_FULLNAME || "G Varela";
const MANAGER_PASSWORD = process.env.MANAGER_TEMP_PASSWORD;

// Validar que contraseña se proporcione via variable de entorno
if (!MANAGER_PASSWORD) {
  console.error("❌ Error: MANAGER_TEMP_PASSWORD no está configurado");
  console.error("Uso: MANAGER_TEMP_PASSWORD=<password> node backend/scripts/createManagerUser.js");
  process.exit(1);
}

async function createManagerUser() {
  try {
    console.log("🔗 Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Paso 1: Buscar o crear rol Manager
    console.log("\n📋 Buscando rol Manager...");
    let managerRole = await Rol.findOne({ codigo: "manager", activo: true });

    if (!managerRole) {
      console.log("⚠️  Rol Manager no existe. Creando...");
      managerRole = new Rol({
        codigo: "manager",
        nombre: "Manager",
        permisos: [
          "usuarios:gestionar",
          "roles:gestionar",
          "tickets:gestionar",
          "configuracion:gestionar",
          "sistema:superusuario",
        ],
        activo: true,
      });
      await managerRole.save();
      console.log("✅ Rol Manager creado:", managerRole._id);
    } else {
      console.log("✅ Rol Manager encontrado:", managerRole._id);
    }

    // Paso 2: Buscar usuario gvarela
    console.log(`\n👤 Buscando usuario ${MANAGER_USERNAME}...`);
    let usuario = await Usuario.findOne({ username: MANAGER_USERNAME });

    if (!usuario) {
      console.log(`⚠️  Usuario ${MANAGER_USERNAME} no existe. Creando...`);
      usuario = new Usuario({
        username: MANAGER_USERNAME,
        email: MANAGER_EMAIL,
        nombre_completo: MANAGER_FULLNAME,
        passwordHash: MANAGER_PASSWORD, // Se hasheará en pre-save
        rol_id: managerRole._id,
        activo: true,
      });
      await usuario.save();
      console.log(`✅ Usuario ${MANAGER_USERNAME} creado:`, usuario._id);
    } else {
      console.log(`✅ Usuario ${MANAGER_USERNAME} encontrado:`, usuario._id);

      // Actualizar para asegurar rol Manager y activo
      if (
        String(usuario.rol_id) !== String(managerRole._id) ||
        !usuario.activo
      ) {
        console.log("⚠️  Actualizando usuario para asegurar rol Manager...");
        usuario.rol_id = managerRole._id;
        usuario.activo = true;
        await usuario.save();
        console.log("✅ Usuario actualizado");
      } else {
        console.log("✅ Usuario ya tiene rol Manager activo");
      }
    }

    // Paso 3: Validar resultados
    console.log("\n✅ VALIDACIÓN FINAL");
    console.log(`Usuario: ${usuario.username}`);
    console.log(`Email: ${usuario.email}`);
    console.log(`Rol ID: ${usuario.rol_id}`);
    console.log(`Rol código: ${managerRole.codigo}`);
    console.log(`Activo: ${usuario.activo}`);

    console.log("\n🎉 Script completado exitosamente");
    console.log(`\n📝 Próximos pasos:`);
    console.log(`1. Cambiar contraseña en primer ingreso`);
    console.log(`2. Validar login: POST /api/auth/login`);
    console.log(`3. Usar JWT retornado en Authorization: Bearer <token>`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

createManagerUser();
