const Ticket = require('../models/ticket.model');
const TicketStatusHistory = require('../models/ticketStatusHistory.model');

const FINAL_TICKET_STATUSES = Object.freeze(new Set([
  'cerrado',
  'resuelto',
  'entregado',
  'cancelado'
]));

const TicketStateAction = Object.freeze({
  TECNICO_ASIGNADO: 'tecnico_asignado',
  DIAGNOSTICO_CREADO: 'diagnostico_creado',
  GARANTIA_REGISTRADA: 'garantia_registrada',
  REPUESTO_SOLICITADO: 'repuesto_solicitado',
  REPUESTO_RECIBIDO: 'repuesto_recibido',
  REPUESTO_ENTREGADO_TECNICO: 'repuesto_entregado_tecnico',
  REPARACION_INICIADA: 'reparacion_iniciada',
  REPARACION_FINALIZADA: 'reparacion_finalizada',
  VALIDACION_TECNICA_APROBADA: 'validacion_tecnica_aprobada',
  MANUAL_STATUS_UPDATE: 'manual_status_update',
  CANCELADO: 'cancelado',
  ENTREGA_COMPLETADA: 'entrega_completada'
});

const actionStateMap = Object.freeze({
  [TicketStateAction.TECNICO_ASIGNADO]: 'asignado',
  [TicketStateAction.DIAGNOSTICO_CREADO]: 'diagnostico',
  [TicketStateAction.GARANTIA_REGISTRADA]: 'pendiente_aprobacion',
  [TicketStateAction.REPUESTO_SOLICITADO]: 'espera_repuesto',
  [TicketStateAction.REPUESTO_RECIBIDO]: 'repuesto_disponible',
  [TicketStateAction.REPUESTO_ENTREGADO_TECNICO]: 'listo_para_reparacion',
  [TicketStateAction.REPARACION_INICIADA]: 'en_reparacion',
  [TicketStateAction.REPARACION_FINALIZADA]: 'reparado_servicio_finalizado',
  [TicketStateAction.VALIDACION_TECNICA_APROBADA]: 'validado_tecnicamente',
  [TicketStateAction.CANCELADO]: 'cancelado',
  [TicketStateAction.ENTREGA_COMPLETADA]: 'cerrado'
});

const allowedTransitions = Object.freeze({
  creado: ['asignado', 'cancelado'],
  asignado: ['en_diagnostico', 'diagnostico', 'diagnosticado', 'pendiente_aprobacion', 'espera_repuesto', 'cancelado'],
  en_diagnostico: ['diagnostico', 'diagnosticado', 'pendiente_aprobacion', 'espera_repuesto', 'en_excepcion'],
  diagnostico: ['pendiente_aprobacion', 'espera_repuesto', 'listo_para_reparacion', 'en_reparacion'],
  diagnosticado: ['pendiente_aprobacion', 'espera_repuesto', 'listo_para_reparacion', 'en_reparacion'],
  pendiente_aprobacion: [
    'garantia_aprobada',
    'reparacion_autorizada',
    'reparacion_no_autorizada',
    'espera_repuesto',
    'listo_para_reparacion'
  ],
  pendiente_autorizacion_garantia: [
    'garantia_aprobada',
    'reparacion_autorizada',
    'reparacion_no_autorizada',
    'espera_repuesto'
  ],
  garantia_aprobada: ['espera_repuesto', 'listo_para_reparacion'],
  reparacion_autorizada: ['espera_repuesto', 'listo_para_reparacion', 'en_reparacion'],
  reparacion_no_autorizada: ['pendiente_cobro_cierre', 'cerrado'],
  listo_reparacion: ['en_reparacion'],
  pendiente_repuesto: ['repuesto_disponible', 'en_excepcion'],
  espera_repuesto: ['repuesto_disponible', 'en_excepcion'],
  pendiente_cotizacion: ['repuesto_solicitado_apa', 'espera_repuesto', 'en_excepcion'],
  repuesto_solicitado_apa: ['espera_repuesto', 'repuesto_disponible', 'en_excepcion'],
  repuesto_disponible: ['listo_para_reparacion'],
  listo_para_reparacion: ['en_reparacion'],
  en_reparacion: ['reparado_servicio_finalizado', 'en_excepcion', 'espera_repuesto', 'pendiente_aprobacion'],
  reparado_servicio_finalizado: ['validado_tecnicamente', 'listo_entrega', 'listo_cobro_entrega'],
  validado_tecnicamente: ['listo_cobro_entrega', 'listo_entrega'],
  listo_cobro_entrega: ['pendiente_cliente', 'pendiente_cobro_cierre', 'listo_entrega'],
  pendiente_cliente: ['pendiente_cobro_cierre', 'listo_entrega'],
  pendiente_cobro_cierre: ['listo_entrega', 'pendiente_cobro_entrega'],
  listo_entrega: ['entregado', 'cerrado'],
  pendiente_cobro_entrega: ['entregado', 'cerrado'],
  entregado: ['cerrado'],
  en_excepcion: ['pendiente_aprobacion', 'espera_repuesto', 'en_reparacion', 'cancelado'],
  cerrado: [],
  cancelado: []
});

function normalizeTicketStatus(status) {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
}

function isFinalTicketStatus(status) {
  return FINAL_TICKET_STATUSES.has(normalizeTicketStatus(status));
}

function assertTicketIsNotFinalized(currentStatus) {
  if (isFinalTicketStatus(currentStatus)) {
    throw new Error('El ticket ya está cerrado o finalizado y no puede cambiarse');
  }
}

function assertTransitionAllowed(fromStatus, toStatus, options = {}) {
  if (options.bypassTransitionValidation || fromStatus === toStatus) return;

  const allowedTargets = allowedTransitions[fromStatus] || [];

  if (!allowedTargets.includes(toStatus)) {
    throw new Error(`Transicion de estado no permitida: ${fromStatus} -> ${toStatus}`);
  }
}

/**
 * Centraliza las transiciones de estado del ticket.
 *
 * @remarks
 * La matriz `allowedTransitions` evita estados inconsistentes. Cada cambio
 * valido crea historial en `ticket_status_history`.
 */
async function applyTicketState(ticketId, action, options = {}) {
  if (!ticketId) {
    throw new Error('El ticket es requerido para actualizar estado');
  }

  const estadoTicket = options.estadoTicket || actionStateMap[action];

  if (!estadoTicket) {
    throw new Error(`Accion de estado no soportada: ${action}`);
  }

  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new Error('Ticket no encontrado para actualizar estado');
  }

  const previousStatus = ticket.estadoTicket;

  if (options.blockFinalStatusChange) {
    assertTicketIsNotFinalized(previousStatus);
  }

  assertTransitionAllowed(previousStatus, estadoTicket, options);

  if (previousStatus === estadoTicket) {
    return ticket;
  }

  ticket.estadoTicket = estadoTicket;
  await ticket.save();

  try {
    await TicketStatusHistory.create({
      ticketId: ticket._id,
      fromStatus: previousStatus,
      toStatus: estadoTicket,
      action,
      changedBy: options.changedBy || null,
      comment: options.comment,
    });
  } catch (error) {
    console.error(`[TicketState] No se pudo guardar historial: ${error.message}`);
  }

  return ticket;
}

module.exports = {
  FINAL_TICKET_STATUSES,
  TicketStateAction,
  actionStateMap,
  allowedTransitions,
  assertTicketIsNotFinalized,
  isFinalTicketStatus,
  applyTicketState
};
