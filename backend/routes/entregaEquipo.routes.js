const EntregaEquipo = require('../models/entregaEquipo.model');
const createCrudRouter = require('./createCrudRouter');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

async function updateTicketFromEntrega(document, req) {
  if (document.estadoEntrega === 'cerrado' || document.estadoEntrega === 'entregado') {
    await applyTicketState(document.ticketId, TicketStateAction.ENTREGA_COMPLETADA, {
      changedBy: req.authUser?.id,
      comment: 'Estado actualizado por entrega y cierre',
      blockFinalStatusChange: true
    });
  }
}

module.exports = createCrudRouter(EntregaEquipo, {
  resourceName: 'Entrega de equipo',
  populate: [
    'ticketId',
    'cobroFacturacionId',
    { path: 'responsableExcepcionId', select: 'username nombre_completo email rol_id' },
    { path: 'entregadoPorId', select: 'username nombre_completo email rol_id' }
  ],
  afterCreate: updateTicketFromEntrega,
  afterUpdate: updateTicketFromEntrega
});
