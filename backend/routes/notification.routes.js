const express = require('express');
const Notification = require('../models/notification.model');
const { requireAuthContext } = require('../middleware/authContext.middleware');

const router = express.Router();

router.get('/', requireAuthContext, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);

    const notifications = await Notification.find({ recipientUserId: req.authUser.id })
      .select('sequence type title message readAt createdAt ticketId actorUserId')
      .populate('ticketId', 'numeroTicket estadoTicket prioridad')
      .populate('actorUserId', 'username nombre_completo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread-count', requireAuthContext, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientUserId: req.authUser.id,
      readAt: null,
    });

    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', requireAuthContext, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientUserId: req.authUser.id,
      },
      { readAt: new Date() },
      { returnDocument: 'after' },
    )
      .select('sequence type title message readAt createdAt ticketId actorUserId')
      .populate('ticketId', 'numeroTicket estadoTicket prioridad')
      .populate('actorUserId', 'username nombre_completo')
      .lean();

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/read-all', requireAuthContext, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientUserId: req.authUser.id,
        readAt: null,
      },
      { readAt: new Date() },
    );

    res.status(200).json({ updated: result.modifiedCount || 0 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
