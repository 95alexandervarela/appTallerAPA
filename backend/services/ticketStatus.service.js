const TicketStatus = require('../models/ticketStatus.model');

const CACHE_TTL_MS = 60 * 1000;
let activeStatusCache = {
  expiresAt: 0,
  items: null,
  map: null,
};

const LEGACY_STATUS_DEFINITIONS = Object.freeze([
  legacyStatus('creado', 'Creado', '#22c55e', false, 10),
  legacyStatus('asignado', 'Asignado', '#6366f1', false, 20),
  legacyStatus('en_diagnostico', 'En diagnostico', '#06b6d4', false, 30),
  legacyStatus('diagnostico', 'Diagnostico', '#06b6d4', false, 31),
  legacyStatus('diagnosticado', 'Diagnosticado', '#06b6d4', false, 32),
  legacyStatus('pendiente_aprobacion', 'Pendiente aprobacion', '#f59e0b', false, 40),
  legacyStatus('pendiente_autorizacion_garantia', 'Pendiente autorizacion', '#f59e0b', false, 41),
  legacyStatus('garantia_aprobada', 'Garantia aprobada', '#22c55e', false, 42),
  legacyStatus('reparacion_autorizada', 'Reparacion autorizada', '#8b5cf6', false, 43),
  legacyStatus('reparacion_no_autorizada', 'No autorizado', '#ef4444', true, 44),
  legacyStatus('pendiente_repuesto', 'Pendiente repuesto', '#f97316', false, 50),
  legacyStatus('espera_repuesto', 'Espera repuesto', '#f97316', false, 51),
  legacyStatus('pendiente_cotizacion', 'Pendiente cotizacion', '#f97316', false, 52),
  legacyStatus('repuesto_solicitado_apa', 'Repuesto solicitado', '#f97316', false, 53),
  legacyStatus('repuesto_disponible', 'Repuesto disponible', '#10b981', false, 54),
  legacyStatus('listo_reparacion', 'Listo reparacion', '#8b5cf6', false, 60),
  legacyStatus('listo_para_reparacion', 'Listo para reparacion', '#8b5cf6', false, 61),
  legacyStatus('en_reparacion', 'En reparacion', '#3b82f6', false, 70),
  legacyStatus('reparado_servicio_finalizado', 'Reparado', '#10b981', false, 80),
  legacyStatus('validado_tecnicamente', 'Validado tecnicamente', '#10b981', false, 81),
  legacyStatus('listo_cobro_entrega', 'Listo cobro / entrega', '#0ea5e9', false, 90),
  legacyStatus('pendiente_cliente', 'Pendiente cliente', '#f59e0b', false, 91),
  legacyStatus('pendiente_cobro_cierre', 'Pendiente cobro', '#f59e0b', false, 92),
  legacyStatus('listo_entrega', 'Listo entrega', '#0ea5e9', false, 100),
  legacyStatus('pendiente_cobro_entrega', 'Pendiente cobro entrega', '#f59e0b', false, 101),
  legacyStatus('entregado', 'Entregado', '#94a3b8', true, 110),
  legacyStatus('cerrado', 'Cerrado', '#94a3b8', true, 120),
  legacyStatus('resuelto', 'Resuelto', '#94a3b8', true, 121),
  legacyStatus('cancelado', 'Cancelado', '#ef4444', true, 130),
  legacyStatus('en_excepcion', 'Excepcion', '#d946ef', false, 140),
]);

function legacyStatus(code, name, color, isFinal, order) {
  return {
    _id: code,
    name,
    code,
    description: 'Estado legacy disponible como fallback de compatibilidad.',
    color,
    isFinal,
    isActive: true,
    order,
    isLegacy: true,
  };
}

function normalizeStatusCode(code) {
  return typeof code === 'string' ? code.trim().toLowerCase() : '';
}

function buildStatusMap(statuses) {
  return new Map(statuses.map((status) => [normalizeStatusCode(status.code), status]));
}

async function loadConfiguredActiveStatuses() {
  return TicketStatus.find({})
    .select('name code description color isFinal isActive order deletedAt createdAt updatedAt')
    .sort({ order: 1, name: 1 })
    .lean();
}

async function getActiveStatuses(options = {}) {
  const now = Date.now();

  if (!options.forceRefresh && activeStatusCache.items && activeStatusCache.expiresAt > now) {
    return activeStatusCache.items;
  }

  const configuredStatuses = await loadConfiguredActiveStatuses();
  const mergedStatusMap = buildStatusMap(LEGACY_STATUS_DEFINITIONS);

  configuredStatuses.forEach((status) => {
    const code = normalizeStatusCode(status.code);

    if (status.isActive && !status.deletedAt) {
      mergedStatusMap.set(code, status);
      return;
    }

    mergedStatusMap.delete(code);
  });

  const statuses = Array.from(mergedStatusMap.values()).sort((firstStatus, secondStatus) => {
    const orderDiff = Number(firstStatus.order || 999) - Number(secondStatus.order || 999);
    return orderDiff || String(firstStatus.name).localeCompare(String(secondStatus.name));
  });

  activeStatusCache = {
    expiresAt: now + CACHE_TTL_MS,
    items: statuses,
    map: buildStatusMap(statuses),
  };

  return statuses;
}

async function getAllConfiguredStatuses() {
  return TicketStatus.find({ deletedAt: null })
    .select('name code description color isFinal isActive order createdAt updatedAt')
    .sort({ order: 1, name: 1 })
    .lean();
}

async function getManageableStatuses() {
  const configuredStatuses = await getAllConfiguredStatuses();
  const mergedStatusMap = buildStatusMap(LEGACY_STATUS_DEFINITIONS);

  configuredStatuses.forEach((status) => {
    mergedStatusMap.set(normalizeStatusCode(status.code), status);
  });

  return Array.from(mergedStatusMap.values()).sort((firstStatus, secondStatus) => {
    const orderDiff = Number(firstStatus.order || 999) - Number(secondStatus.order || 999);
    return orderDiff || String(firstStatus.name).localeCompare(String(secondStatus.name));
  });
}

async function getStatusByCode(code) {
  const normalizedCode = normalizeStatusCode(code);
  await getActiveStatuses();
  return activeStatusCache.map.get(normalizedCode) || null;
}

async function isFinalStatus(code) {
  const status = await getStatusByCode(code);
  return Boolean(status?.isFinal);
}

async function refreshTicketStatusCache() {
  return getActiveStatuses({ forceRefresh: true });
}

function invalidateTicketStatusCache() {
  activeStatusCache = {
    expiresAt: 0,
    items: null,
    map: null,
  };
}

module.exports = {
  LEGACY_STATUS_DEFINITIONS,
  normalizeStatusCode,
  getActiveStatuses,
  getAllConfiguredStatuses,
  getManageableStatuses,
  getStatusByCode,
  isFinalStatus,
  refreshTicketStatusCache,
  invalidateTicketStatusCache,
};
