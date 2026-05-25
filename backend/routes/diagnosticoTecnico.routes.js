const DiagnosticoTecnico = require('../models/diagnosticoTecnico.model');
const createCrudRouter = require('./createCrudRouter');

module.exports = createCrudRouter(DiagnosticoTecnico, {
  resourceName: 'Diagnostico tecnico',
  populate: [
    'ticketId',
    { path: 'tecnicoId', select: 'username nombre_completo email rol_id' },
    { path: 'asistenteTecnicoId', select: 'username nombre_completo email rol_id' }
  ]
});
