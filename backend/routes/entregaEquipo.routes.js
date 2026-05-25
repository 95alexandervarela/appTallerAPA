const EntregaEquipo = require('../models/entregaEquipo.model');
const createCrudRouter = require('./createCrudRouter');

module.exports = createCrudRouter(EntregaEquipo, {
  resourceName: 'Entrega de equipo',
  populate: [
    'ticketId',
    'cobroFacturacionId',
    { path: 'responsableExcepcionId', select: 'username nombre_completo email rol_id' },
    { path: 'entregadoPorId', select: 'username nombre_completo email rol_id' }
  ]
});
