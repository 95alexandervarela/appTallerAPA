const ReparacionEquipo = require('../models/reparacionEquipo.model');
const createCrudRouter = require('./createCrudRouter');

module.exports = createCrudRouter(ReparacionEquipo, {
  resourceName: 'Reparacion de equipo',
  populate: [
    'ticketId',
    { path: 'tecnicoId', select: 'username nombre_completo email rol_id' },
    { path: 'asistenteTecnicoId', select: 'username nombre_completo email rol_id' }
  ]
});
