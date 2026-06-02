const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/ticket.model');
const TicketStatusHistory = require('../models/ticketStatusHistory.model');
const { requireAuthContext } = require('../middleware/authContext.middleware');
const { getActiveStatuses } = require('../services/ticketStatus.service');

const router = express.Router();

const HIGH_PRIORITY_VALUES = ['alta', 'urgente'];
const LEGACY_FINAL_STATUS_CODES = ['cerrado', 'cancelado', 'entregado', 'resuelto'];

const buildStatusMetadata = async () => {
  const statuses = await getActiveStatuses();
  const statusMap = new Map(statuses.map((status) => [status.code, status]));
  const finalCodes = statuses
    .filter((status) => status.isFinal)
    .map((status) => status.code);

  return {
    statuses,
    statusMap,
    finalCodes: Array.from(new Set([...finalCodes, ...LEGACY_FINAL_STATUS_CODES])),
  };
};

const buildVisibleTicketMatch = (authUser) => {
  const match = { activo: true };

  if (authUser.roleCode === 'tecnico') {
    match.tecnicoAsignado = new mongoose.Types.ObjectId(authUser.id);
  }

  return match;
};

const buildMyTicketsMatch = (authUser) => {
  const userObjectId = new mongoose.Types.ObjectId(authUser.id);

  if (authUser.roleCode === 'tecnico') {
    return { activo: true, tecnicoAsignado: userObjectId };
  }

  return {
    activo: true,
    $or: [{ tecnicoAsignado: userObjectId }, { creadoPor: userObjectId }],
  };
};

const enrichStatusCounts = (statuses, counts) => {
  const countMap = new Map(counts.map((item) => [item.estado, item.count]));
  const configuredCards = statuses
    .map((status) => ({
      estado: status.code,
      label: status.name,
      color: status.color,
      isFinal: Boolean(status.isFinal),
      count: countMap.get(status.code) || 0,
    }))
    .filter((item) => item.count > 0);

  const configuredCodes = new Set(statuses.map((status) => status.code));
  const unknownCards = counts
    .filter((item) => !configuredCodes.has(item.estado))
    .map((item) => ({
      estado: item.estado,
      label: item.estado,
      color: '#64748b',
      isFinal: LEGACY_FINAL_STATUS_CODES.includes(item.estado),
      count: item.count,
    }));

  return [...configuredCards, ...unknownCards];
};

const formatRecentActivity = (activity, statusMap) =>
  activity.map((item) => {
    const toStatus = statusMap.get(item.toStatus);
    const fromStatus = statusMap.get(item.fromStatus);

    return {
      ticket: item.ticket?.numeroTicket || 'Ticket',
      ticketId: item.ticket?._id || item.ticketId,
      accion: item.action,
      usuario: item.user?.nombre_completo || item.user?.username || 'Sistema',
      fecha: item.createdAt,
      fromStatus: item.fromStatus,
      fromStatusLabel: fromStatus?.name || item.fromStatus,
      toStatus: item.toStatus,
      toStatusLabel: toStatus?.name || item.toStatus,
      color: toStatus?.color || '#64748b',
    };
  });

router.get('/overview', requireAuthContext, async (req, res) => {
  try {
    const { statuses, statusMap, finalCodes } = await buildStatusMetadata();
    const visibleTicketMatch = buildVisibleTicketMatch(req.authUser);
    const myTicketsMatch = buildMyTicketsMatch(req.authUser);
    const openStatusMatch = { $nin: finalCodes };

    const [summary] = await Ticket.aggregate([
      { $match: visibleTicketMatch },
      {
        $facet: {
          totalTickets: [{ $count: 'count' }],
          ticketsPorEstado: [
            { $group: { _id: '$estadoTicket', count: { $sum: 1 } } },
            { $project: { _id: 0, estado: '$_id', count: 1 } },
            { $sort: { count: -1, estado: 1 } },
          ],
          cerrados: [
            { $match: { estadoTicket: { $in: finalCodes } } },
            { $count: 'count' },
          ],
          urgentes: [
            {
              $match: {
                prioridad: { $in: HIGH_PRIORITY_VALUES },
                estadoTicket: openStatusMatch,
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const [myTicketsResult, recentActivity] = await Promise.all([
      Ticket.countDocuments(myTicketsMatch),
      TicketStatusHistory.aggregate([
        {
          $lookup: {
            from: 'tickets_taller',
            localField: 'ticketId',
            foreignField: '_id',
            as: 'ticket',
            pipeline: [
              {
                $project: {
                  numeroTicket: 1,
                  tecnicoAsignado: 1,
                  activo: 1,
                },
              },
            ],
          },
        },
        { $unwind: '$ticket' },
        { $match: { 'ticket.activo': true } },
        ...(req.authUser.roleCode === 'tecnico'
          ? [
              {
                $match: {
                  'ticket.tecnicoAsignado': new mongoose.Types.ObjectId(req.authUser.id),
                },
              },
            ]
          : []),
        { $sort: { createdAt: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'users',
            localField: 'changedBy',
            foreignField: '_id',
            as: 'user',
            pipeline: [{ $project: { username: 1, nombre_completo: 1 } }],
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            ticketId: 1,
            ticket: {
              _id: '$ticket._id',
              numeroTicket: '$ticket.numeroTicket',
            },
            action: 1,
            fromStatus: 1,
            toStatus: 1,
            createdAt: 1,
            user: 1,
          },
        },
      ]),
    ]);

    const totalTickets = summary.totalTickets[0]?.count || 0;
    const cerrados = summary.cerrados[0]?.count || 0;
    const urgentes = summary.urgentes[0]?.count || 0;

    res.status(200).json({
      totalTickets,
      ticketsPorEstado: enrichStatusCounts(statuses, summary.ticketsPorEstado),
      misTickets: myTicketsResult,
      urgentes,
      cerrados,
      recientes: formatRecentActivity(recentActivity, statusMap),
      scope: req.authUser.roleCode === 'tecnico' ? 'assigned' : 'global',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
