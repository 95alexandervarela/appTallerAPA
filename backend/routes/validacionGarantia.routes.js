const ValidacionGarantia = require('../models/validacionGarantia.model');
const createCrudRouter = require('./createCrudRouter');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

async function updateTicketFromGarantia(document, req) {
  const options = {
    changedBy: req.authUser?.id,
    comment: 'Estado actualizado por validacion de garantia',
    blockFinalStatusChange: true
  };

  if (document.requiereRepuesto || document.estadoValidacion === 'pendiente_repuesto') {
    await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_SOLICITADO, options);
    return;
  }

  if (
    ['garantia_aprobada', 'reparacion_autorizada', 'listo_reparacion'].includes(document.estadoValidacion)
  ) {
    await applyTicketState(document.ticketId, TicketStateAction.MANUAL_STATUS_UPDATE, {
      ...options,
      estadoTicket: 'listo_para_reparacion'
    });
    return;
  }

  await applyTicketState(document.ticketId, TicketStateAction.GARANTIA_REGISTRADA, options);
}

module.exports = createCrudRouter(ValidacionGarantia, {
  resourceName: 'Validacion de garantia',
  populate: [
    'ticketId',
    'diagnosticoId',
    { path: 'responsableId', select: 'username nombre_completo email rol_id' }
  ],
  afterCreate: updateTicketFromGarantia,
  afterUpdate: updateTicketFromGarantia
});
