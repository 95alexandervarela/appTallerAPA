require('dotenv').config();

const mongoose = require('mongoose');
const RecepcionEquipo = require('../models/recepcionEquipo.model');
const Ticket = require('../models/ticket.model');
const Usuario = require('../models/user.model');
const Rol = require('../models/role.model');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');
const { createTicketAssignedNotification } = require('../services/notification.service');
const { LEGACY_ROLE_FALLBACKS, buildSafeAuthUser } = require('../services/authUser.service');

const TOTAL_TICKETS = 40;

const deviceTypes = ['Laptop', 'Desktop', 'Impresora', 'Monitor', 'UPS', 'Servidor', 'Tablet', 'Scanner'];
const brands = ['Dell', 'HP', 'Lenovo', 'Epson', 'APC', 'Samsung', 'Acer', 'Brother'];
const failures = [
  'No enciende',
  'Pantalla intermitente',
  'Lentitud general',
  'No imprime',
  'Ruido en ventilador',
  'Falla de red',
  'Sistema no inicia',
  'Puerto USB danado',
];
const priorities = ['baja', 'media', 'alta', 'urgente'];

async function getRoleCode(user) {
  const roleId = String(user.rol_id || '');
  const fallback = LEGACY_ROLE_FALLBACKS[roleId];

  if (fallback) return fallback.codigo;

  const role = await Rol.findById(user.rol_id).select('codigo').lean();
  return role?.codigo || 'desconocido';
}

function pad(value) {
  return String(value).padStart(4, '0');
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/appTallerAPA');

  const users = await Usuario.find({ activo: true }).sort({ nombre_completo: 1 });
  const usersWithRoles = [];

  for (const user of users) {
    usersWithRoles.push({
      user,
      roleCode: await getRoleCode(user),
    });
  }

  const assignableUsers = usersWithRoles
    .filter(({ roleCode }) => ['tecnico', 'administrador', 'manager'].includes(roleCode))
    .map(({ user, roleCode }) => ({ user, roleCode }));

  const creator = usersWithRoles.find(({ roleCode }) => roleCode === 'manager')?.user
    || usersWithRoles.find(({ roleCode }) => roleCode === 'administrador')?.user;

  if (!creator) {
    throw new Error('No se encontro un usuario manager o administrador para crear los tickets');
  }

  if (!assignableUsers.length) {
    throw new Error('No hay usuarios tecnicos/administradores/managers activos para asignar tickets');
  }

  const safeCreator = await buildSafeAuthUser(creator);
  const batchCode = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  const created = [];
  const assignedCount = new Map();

  for (let index = 0; index < TOTAL_TICKETS; index += 1) {
    const sequence = index + 1;
    const assigned = assignableUsers[index % assignableUsers.length];
    const deviceType = deviceTypes[index % deviceTypes.length];
    const brand = brands[index % brands.length];
    const failure = failures[index % failures.length];
    const ticketNumber = `TEST-${batchCode}-${pad(sequence)}`;
    const caseNumber = `CASE-${batchCode}-${pad(sequence)}`;

    const recepcion = await RecepcionEquipo.create({
      numeroCaso: caseNumber,
      origenEquipo: index % 2 === 0 ? 'cliente_final' : 'sucursal',
      nombreCliente: `Cliente Prueba ${pad(sequence)}`,
      telefonoCliente: `9999-${pad(sequence)}`,
      correoCliente: `cliente.prueba.${sequence}@example.com`,
      sucursalOrigen: index % 2 === 0 ? '' : 'Sucursal Central',
      tipoEquipo: deviceType,
      marcaEquipo: brand,
      modeloEquipo: `Modelo ${100 + sequence}`,
      serieEquipo: `SERIE-${batchCode}-${pad(sequence)}`,
      fallaReportada: failure,
      condicionFisica: 'Equipo recibido para prueba de asignacion masiva',
      accesoriosEntregados: ['Cable de poder'],
      datosCompletos: true,
      ingresoAutorizado: true,
      comprobanteEntregado: true,
      equipoEtiquetado: true,
      estadoRecepcion: 'registrado',
      recibidoPor: creator._id,
      autorizadoPor: creator._id,
      referenciaSap: `SAP-${batchCode}-${pad(sequence)}`,
    });

    const ticket = await Ticket.create({
      numeroTicket: ticketNumber,
      recepcionEquipoId: recepcion._id,
      numeroCasoRecepcion: recepcion.numeroCaso,
      creadoPor: creator._id,
      tecnicoAsignado: assigned.user._id,
      prioridad: priorities[index % priorities.length],
      estadoTicket: 'creado',
      nombreCliente: recepcion.nombreCliente,
      telefonoCliente: recepcion.telefonoCliente,
      tipoEquipo: recepcion.tipoEquipo,
      marcaEquipo: recepcion.marcaEquipo,
      modeloEquipo: recepcion.modeloEquipo,
      serieEquipo: recepcion.serieEquipo,
      fallaReportada: recepcion.fallaReportada,
      condicionFisica: recepcion.condicionFisica,
      accesoriosEntregados: recepcion.accesoriosEntregados,
      observacionesAsignacion: `Ticket de prueba asignado a ${assigned.user.nombre_completo}`,
      fechaAsignacion: new Date(),
    });

    await applyTicketState(ticket._id, TicketStateAction.TECNICO_ASIGNADO, {
      changedBy: creator._id,
      comment: 'Asignacion generada por script de prueba masiva',
    });

    await createTicketAssignedNotification({
      ticket,
      assignedTo: assigned.user,
      assignedBy: safeCreator,
    });

    const key = `${assigned.user.nombre_completo} (${assigned.roleCode})`;
    assignedCount.set(key, (assignedCount.get(key) || 0) + 1);
    created.push(ticketNumber);
  }

  console.log(JSON.stringify({
    batchCode,
    totalCreated: created.length,
    createdBy: creator.nombre_completo,
    assignedDistribution: Object.fromEntries(assignedCount),
    firstTicket: created[0],
    lastTicket: created[created.length - 1],
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
