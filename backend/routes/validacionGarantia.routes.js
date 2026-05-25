const ValidacionGarantia = require('../models/validacionGarantia.model');
const createCrudRouter = require('./createCrudRouter');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

async function updateTicketFromGarantia(document) {
  await applyTicketState(document.ticketId, TicketStateAction.GARANTIA_REGISTRADA);
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
