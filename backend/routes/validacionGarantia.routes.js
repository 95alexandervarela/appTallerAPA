const ValidacionGarantia = require('../models/validacionGarantia.model');
const createCrudRouter = require('./createCrudRouter');

module.exports = createCrudRouter(ValidacionGarantia, {
  resourceName: 'Validacion de garantia',
  populate: [
    'ticketId',
    'diagnosticoId',
    { path: 'responsableId', select: 'username nombre_completo email rol_id' }
  ]
});
