require("dotenv").config();

const mongoose = require("mongoose");
const RecepcionEquipo = require("../models/recepcionEquipo.model");
const Ticket = require("../models/ticket.model");
const Usuario = require("../models/user.model");

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/appTallerAPA";

const LEGACY_ADMIN_ROLE_ID = "6a126c9296a6e0cb6e9df8a3";
const LEGACY_TECNICO_ROLE_ID = "6a126c9296a6e0cb6e9df8a4";
const TOTAL_TICKETS = 60;
const ADMIN_TICKETS = 10;
const BATCH_PREFIX = "DEMO60";

const adminSeeds = [
  {
    username: "ahernandez",
    email: "antonio.hernandez@app.com",
    nombre_completo: "Antonio Hernandez",
  },
  {
    username: "jlainez",
    email: "jose.lainez@app.com",
    nombre_completo: "Jose Lainez",
  },
  {
    username: "ohernandez",
    email: "oswaldo.hernandez@app.com",
    nombre_completo: "Oswaldo Hernandez",
  },
];

const technicianUsernames = ["adedios", "dperez", "nbatiz", "fcaballero"];

const deviceTypes = [
  "Laptop",
  "Desktop",
  "Impresora",
  "Monitor",
  "UPS",
  "Scanner",
  "Tablet",
  "Servidor",
];
const brands = ["Dell", "HP", "Lenovo", "Epson", "APC", "Brother", "Samsung", "Acer"];
const failures = [
  "No enciende",
  "No imprime",
  "Pantalla intermitente",
  "Falla de red",
  "Ruido en ventilador",
  "Sistema no inicia",
  "Puerto USB danado",
  "Lentitud general",
];
const priorities = ["baja", "media", "alta", "urgente"];
const states = [
  "asignado",
  "en_diagnostico",
  "diagnosticado",
  "espera_repuesto",
  "listo_para_reparacion",
  "en_reparacion",
  "reparado_servicio_finalizado",
  "pendiente_aprobacion",
];

function pad(value, size = 3) {
  return String(value).padStart(size, "0");
}

function buildPasswordPlaceholder(username) {
  return `${username}*Demo2026`;
}

async function upsertUser(seed, roleId) {
  let user = await Usuario.findOne({ username: seed.username });

  if (!user) {
    user = new Usuario({
      username: seed.username,
      email: seed.email,
      nombre_completo: seed.nombre_completo,
      rol_id: roleId,
      activo: true,
    });
    user.setPassword(buildPasswordPlaceholder(seed.username));
    await user.save();
    return user;
  }

  let changed = false;

  if (user.email !== seed.email) {
    user.email = seed.email;
    changed = true;
  }

  if (user.nombre_completo !== seed.nombre_completo) {
    user.nombre_completo = seed.nombre_completo;
    changed = true;
  }

  if (String(user.rol_id) !== roleId) {
    user.rol_id = roleId;
    changed = true;
  }

  if (!user.activo) {
    user.activo = true;
    changed = true;
  }

  if (changed) {
    await user.save();
  }

  return user;
}

async function getCreator() {
  const creator =
    (await Usuario.findOne({ username: "sistemas", activo: true })) ||
    (await Usuario.findOne({ username: "hmartinez", activo: true }));

  if (!creator) {
    throw new Error("No existe usuario sistemas/hmartinez para crear tickets demo");
  }

  return creator;
}

async function getTechnicians() {
  const technicians = await Usuario.find({
    username: { $in: technicianUsernames },
    activo: true,
  }).sort({ nombre_completo: 1 });

  if (!technicians.length) {
    throw new Error("No hay tecnicos activos para repartir los tickets");
  }

  return technicians;
}

async function ensureAdmins() {
  const admins = [];

  for (const seed of adminSeeds) {
    admins.push(await upsertUser(seed, LEGACY_ADMIN_ROLE_ID));
  }

  return admins;
}

async function createTicket(sequence, assignedUser, creator, assignedGroup) {
  const number = `${BATCH_PREFIX}-${pad(sequence)}`;
  const deviceType = deviceTypes[(sequence - 1) % deviceTypes.length];
  const brand = brands[(sequence - 1) % brands.length];
  const failure = failures[(sequence - 1) % failures.length];
  const createdAt = new Date(Date.now() - sequence * 60 * 60 * 1000);

  const recepcion = await RecepcionEquipo.create({
    numeroCaso: number,
    origenEquipo: sequence % 2 === 0 ? "cliente_final" : "sucursal",
    nombreCliente: `Cliente Demo ${pad(sequence)}`,
    telefonoCliente: `9999-${String(1000 + sequence).slice(-4)}`,
    correoCliente: `cliente.demo.${sequence}@example.com`,
    sucursalOrigen: sequence % 2 === 0 ? "" : "Sucursal Central",
    tipoEquipo: deviceType,
    marcaEquipo: brand,
    modeloEquipo: `Modelo ${200 + sequence}`,
    serieEquipo: `${BATCH_PREFIX}-SER-${pad(sequence)}`,
    fallaReportada: failure,
    condicionFisica: "Equipo recibido para prueba de carga operativa",
    accesoriosEntregados: ["Cable de poder"],
    datosCompletos: true,
    ingresoAutorizado: true,
    comprobanteEntregado: true,
    equipoEtiquetado: true,
    estadoRecepcion: "registrado",
    recibidoPor: creator._id,
    autorizadoPor: creator._id,
    referenciaSap: `${BATCH_PREFIX}-SAP-${pad(sequence)}`,
    fechaIngreso: createdAt,
    fechaCreacion: createdAt,
  });

  return Ticket.create({
    numeroTicket: number,
    recepcionEquipoId: recepcion._id,
    numeroCasoRecepcion: recepcion.numeroCaso,
    creadoPor: creator._id,
    tecnicoAsignado: assignedUser._id,
    prioridad: priorities[(sequence - 1) % priorities.length],
    estadoTicket: states[(sequence - 1) % states.length],
    nombreCliente: recepcion.nombreCliente,
    telefonoCliente: recepcion.telefonoCliente,
    tipoEquipo: recepcion.tipoEquipo,
    marcaEquipo: recepcion.marcaEquipo,
    modeloEquipo: recepcion.modeloEquipo,
    serieEquipo: recepcion.serieEquipo,
    fallaReportada: recepcion.fallaReportada,
    condicionFisica: recepcion.condicionFisica,
    accesoriosEntregados: recepcion.accesoriosEntregados,
    observacionesAsignacion: `Ticket demo ${assignedGroup} asignado a ${assignedUser.nombre_completo}`,
    fechaAsignacion: createdAt,
    fechaCreacion: createdAt,
  });
}

async function main() {
  await mongoose.connect(MONGO_URI);

  const existingCount = await Ticket.countDocuments({
    numeroTicket: { $regex: `^${BATCH_PREFIX}-` },
  });

  if (existingCount >= TOTAL_TICKETS) {
    console.log(JSON.stringify({
      message: "Los tickets demo ya existen. No se duplicaron registros.",
      existingCount,
      prefix: BATCH_PREFIX,
    }, null, 2));
    await mongoose.disconnect();
    return;
  }

  await Ticket.deleteMany({ numeroTicket: { $regex: `^${BATCH_PREFIX}-` } });
  await RecepcionEquipo.deleteMany({ numeroCaso: { $regex: `^${BATCH_PREFIX}-` } });

  const creator = await getCreator();
  const admins = await ensureAdmins();
  const technicians = await getTechnicians();
  const distribution = new Map();

  for (let sequence = 1; sequence <= TOTAL_TICKETS; sequence += 1) {
    const isAdminTicket = sequence > TOTAL_TICKETS - ADMIN_TICKETS;
    const pool = isAdminTicket ? admins : technicians;
    const assigned = pool[(sequence - 1) % pool.length];
    const group = isAdminTicket ? "administrador" : "tecnico";

    await createTicket(sequence, assigned, creator, group);

    const key = `${assigned.nombre_completo} (${group})`;
    distribution.set(key, (distribution.get(key) || 0) + 1);
  }

  console.log(JSON.stringify({
    message: "Tickets demo creados correctamente",
    totalCreated: TOTAL_TICKETS,
    technicianTickets: TOTAL_TICKETS - ADMIN_TICKETS,
    adminTickets: ADMIN_TICKETS,
    prefix: BATCH_PREFIX,
    createdBy: creator.nombre_completo,
    distribution: Object.fromEntries(distribution),
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
