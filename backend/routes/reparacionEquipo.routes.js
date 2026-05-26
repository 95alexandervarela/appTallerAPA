const ReparacionEquipo = require('../models/reparacionEquipo.model');
const createCrudRouter = require('./createCrudRouter');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

async function updateTicketFromReparacion(document, req) {
  const options = {
    changedBy: req.authUser?.id,
    comment: 'Estado actualizado por reparacion de equipo'
  };

  if (document.estadoReparacion === 'validado_tecnicamente' || document.validacionTecnicaAprobada) {
    await applyTicketState(document.ticketId, TicketStateAction.VALIDACION_TECNICA_APROBADA, options);
    return;
  }

  if (document.estadoReparacion === 'reparado_servicio_finalizado') {
    await applyTicketState(document.ticketId, TicketStateAction.REPARACION_FINALIZADA, options);
    return;
  }

  if (document.estadoReparacion === 'en_reparacion') {
    await applyTicketState(document.ticketId, TicketStateAction.REPARACION_INICIADA, options);
  }
}

module.exports = createCrudRouter(ReparacionEquipo, {
  resourceName: 'Reparacion de equipo',
  populate: [
    'ticketId',
    { path: 'tecnicoId', select: 'username nombre_completo email rol_id' },
    { path: 'asistenteTecnicoId', select: 'username nombre_completo email rol_id' }
  ],
  afterCreate: updateTicketFromReparacion,
  afterUpdate: updateTicketFromReparacion
});
