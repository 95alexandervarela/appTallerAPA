const GestionRepuesto = require('../models/gestionRepuesto.model');
const createCrudRouter = require('./createCrudRouter');

module.exports = createCrudRouter(GestionRepuesto, {
  resourceName: 'Gestion de repuesto',
  populate: [
    'ticketId',
    'diagnosticoId',
    { path: 'tecnicoSolicitanteId', select: 'username nombre_completo email rol_id' },
    { path: 'asistenteResponsableId', select: 'username nombre_completo email rol_id' },
    { path: 'tecnicoRecibeId', select: 'username nombre_completo email rol_id' }
  ]
});
