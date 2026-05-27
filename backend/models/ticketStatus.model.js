const mongoose = require('mongoose');

/**
 * Estado configurable para tickets.
 *
 * @remarks
 * Convive con los estados legacy en `ticket.estadoTicket`; no reemplaza enums
 * existentes, solo permite administrarlos progresivamente desde Configuracion.
 */
const ticketStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    code: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 240,
    },
    color: {
      type: String,
      trim: true,
      default: '#38bdf8',
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 999,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'ticket_statuses',
  },
);

ticketStatusSchema.index({ code: 1 }, { unique: true });
ticketStatusSchema.index({ isActive: 1 });
ticketStatusSchema.index({ order: 1 });

module.exports = mongoose.model('TicketStatus', ticketStatusSchema);
