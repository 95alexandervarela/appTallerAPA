const CobroFacturacion = require('../models/cobroFacturacion.model');
const createCrudRouter = require('./createCrudRouter');

module.exports = createCrudRouter(CobroFacturacion, {
  resourceName: 'Cobro y facturacion',
  populate: ['ticketId', 'recepcionId']
});
