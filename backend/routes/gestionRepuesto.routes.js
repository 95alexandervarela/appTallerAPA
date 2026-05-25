const GestionRepuesto = require('../models/gestionRepuesto.model');
const createCrudRouter = require('./createCrudRouter');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

async function updateTicketFromRepuesto(document) {
  if (document.entregadoTecnico || document.estadoRepuesto === 'entregado_tecnico') {
    await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_ENTREGADO_TECNICO);
    return;
  }

  if (
    document.estadoRepuesto === 'repuesto_disponible'
    || document.repuestoValidado
    || document.disponibleApa
    || document.cantidadRecibida >= document.cantidad
  ) {
    await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_RECIBIDO);
    return;
  }

  await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_SOLICITADO);
}

module.exports = createCrudRouter(GestionRepuesto, {
  resourceName: 'Gestion de repuesto',
  populate: [
    'ticketId',
    'diagnosticoId',
    { path: 'tecnicoSolicitanteId', select: 'username nombre_completo email rol_id' },
    { path: 'asistenteResponsableId', select: 'username nombre_completo email rol_id' },
    { path: 'tecnicoRecibeId', select: 'username nombre_completo email rol_id' }
  ],
  afterCreate: updateTicketFromRepuesto,
  afterUpdate: updateTicketFromRepuesto
});
