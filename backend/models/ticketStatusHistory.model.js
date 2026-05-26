const mongoose = require('mongoose');

/**
 * Historial de transiciones de estado de tickets.
 *
 * @remarks
 * Permite auditar cada cambio aplicado por `ticketState.service.js` sin
 * mezclar trazabilidad dentro del documento principal del ticket.
 */
const ticketStatusHistorySchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'El ticket es requerido']
  },
  fromStatus: {
    type: String,
    required: [true, 'El estado origen es requerido'],
    trim: true
  },
  toStatus: {
    type: String,
    required: [true, 'El estado destino es requerido'],
    trim: true
  },
  action: {
    type: String,
    required: [true, 'La accion es requerida'],
    trim: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'ticket_status_history',
  timestamps: false
});

const TicketStatusHistory = mongoose.model('TicketStatusHistory', ticketStatusHistorySchema);

module.exports = TicketStatusHistory;
