const GestionRepuesto = require('../models/gestionRepuesto.model');
const createCrudRouter = require('./createCrudRouter');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

async function updateTicketFromRepuesto(document, req) {
  const options = {
    changedBy: req.authUser?.id,
    comment: 'Estado actualizado por gestion de repuesto',
    blockFinalStatusChange: true
  };

  if (document.entregadoTecnico || document.estadoRepuesto === 'entregado_tecnico') {
    await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_ENTREGADO_TECNICO, options);
    return;
  }

  if (
    document.estadoRepuesto === 'repuesto_disponible'
    || document.repuestoValidado
    || document.disponibleApa
    || document.cantidadRecibida >= document.cantidad
  ) {
    await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_RECIBIDO, options);
    return;
  }

  await applyTicketState(document.ticketId, TicketStateAction.REPUESTO_SOLICITADO, options);
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
