const mongoose = require('mongoose');

/**
 * Comentarios internos asociados a un ticket.
 *
 * @remarks
 * Guarda un historial simple tipo log/chat sin mezclar comentarios dentro del
 * documento principal del ticket.
 */
const ticketCommentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'El ticket es requerido']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario es requerido']
  },
  message: {
    type: String,
    required: [true, 'El comentario es requerido'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'ticket_comments',
  timestamps: false
});

const TicketComment = mongoose.model('TicketComment', ticketCommentSchema);

module.exports = TicketComment;
