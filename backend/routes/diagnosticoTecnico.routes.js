const DiagnosticoTecnico = require('../models/diagnosticoTecnico.model');
const createCrudRouter = require('./createCrudRouter');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

async function updateTicketFromDiagnostico(document, req) {
  const options = {
    changedBy: req.authUser?.id,
    comment: 'Estado actualizado por diagnostico tecnico',
    blockFinalStatusChange: true
  };

  if (document.requiereGarantiaAutorizacion) {
    await applyTicketState(document.ticketId, TicketStateAction.GARANTIA_REGISTRADA, options);
    return;
  }

  if (document.repuestoRequerido) {
    await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_SOLICITADO, options);
    return;
  }

  await applyTicketState(document.ticketId, TicketStateAction.DIAGNOSTICO_CREADO, options);
}

module.exports = createCrudRouter(DiagnosticoTecnico, {
  resourceName: 'Diagnostico tecnico',
  populate: [
    'ticketId',
    { path: 'tecnicoId', select: 'username nombre_completo email rol_id' },
    { path: 'asistenteTecnicoId', select: 'username nombre_completo email rol_id' }
  ],
  afterCreate: updateTicketFromDiagnostico,
  afterUpdate: updateTicketFromDiagnostico
});
