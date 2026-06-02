const Notification = require('../models/notification.model');
const NotificationCounter = require('../models/notificationCounter.model');

const NotificationType = Object.freeze({
  TICKET_ASSIGNED: 'ticket_assigned',
});

async function getNextNotificationSequence(userId) {
  const counter = await NotificationCounter.findOneAndUpdate(
    { userId },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  return counter.sequence;
}

async function createTicketAssignedNotification({ ticket, assignedTo, assignedBy }) {
  if (!ticket?._id || !assignedTo?._id) return null;

  const sequence = await getNextNotificationSequence(assignedTo._id);
  const ticketNumber = ticket.numeroTicket || ticket.numeroCasoRecepcion || 'ticket';
  const actorName = assignedBy?.name || assignedBy?.username || 'Un usuario';

  return Notification.create({
    recipientUserId: assignedTo._id,
    actorUserId: assignedBy?.id || null,
    ticketId: ticket._id,
    sequence,
    type: NotificationType.TICKET_ASSIGNED,
    title: `Ticket asignado #${sequence}`,
    message: `${actorName} te asignó el ticket ${ticketNumber}.`,
  });
}

module.exports = {
  NotificationType,
  createTicketAssignedNotification,
};
