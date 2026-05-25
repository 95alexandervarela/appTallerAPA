const Ticket = require('../models/ticket.model');

const TicketStateAction = Object.freeze({
  DIAGNOSTICO_CREADO: 'diagnostico_creado',
  GARANTIA_REGISTRADA: 'garantia_registrada',
  REPUESTO_SOLICITADO: 'repuesto_solicitado',
  REPUESTO_RECIBIDO: 'repuesto_recibido',
  REPUESTO_ENTREGADO_TECNICO: 'repuesto_entregado_tecnico',
  REPARACION_INICIADA: 'reparacion_iniciada',
  ENTREGA_COMPLETADA: 'entrega_completada'
});

const actionStateMap = Object.freeze({
  [TicketStateAction.DIAGNOSTICO_CREADO]: 'diagnostico',
  [TicketStateAction.GARANTIA_REGISTRADA]: 'pendiente_aprobacion',
  [TicketStateAction.REPUESTO_SOLICITADO]: 'espera_repuesto',
  [TicketStateAction.REPUESTO_RECIBIDO]: 'repuesto_disponible',
  [TicketStateAction.REPUESTO_ENTREGADO_TECNICO]: 'listo_para_reparacion',
  [TicketStateAction.REPARACION_INICIADA]: 'en_reparacion',
  [TicketStateAction.ENTREGA_COMPLETADA]: 'cerrado'
});

/**
 * Centraliza las transiciones de estado del ticket.
 *
 * La regla de negocio es que el ticket solo tenga un estado activo, derivado
 * de eventos operativos: diagnostico, garantia, repuesto, reparacion o cierre.
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

  ticket.estadoTicket = estadoTicket;
  await ticket.save();

  return ticket;
}

module.exports = {
  TicketStateAction,
  applyTicketState
};
