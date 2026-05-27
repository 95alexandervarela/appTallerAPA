const express = require('express');
const TicketStatus = require('../models/ticketStatus.model');
const { requireAuthContext, requireRole } = require('../middleware/authContext.middleware');
const {
  getActiveStatuses,
  getManageableStatuses,
  invalidateTicketStatusCache,
  refreshTicketStatusCache,
} = require('../services/ticketStatus.service');

const router = express.Router();

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildPayload(body) {
  const name = String(body.name || '').trim();
  const code = normalizeCode(body.code || name);

  return {
    name,
    code,
    description: String(body.description || '').trim(),
    color: String(body.color || '#38bdf8').trim(),
    isFinal: Boolean(body.isFinal),
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 999,
  };
}

function assertValidStatusPayload(payload) {
  if (!payload.name) {
    throw new Error('El nombre del estado es requerido');
  }

  if (!payload.code) {
    throw new Error('El codigo del estado es requerido');
  }
}

/**
 * Estados activos para dropdowns del flujo de tickets.
 *
 * @remarks
 * Todos los usuarios autenticados pueden leerlos. Si no hay configuracion en
 * MongoDB, el servicio devuelve el catalogo legacy como fallback.
 */
router.get('/active', requireAuthContext, async (req, res) => {
  try {
    const statuses = await getActiveStatuses();
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireAuthContext, requireRole(['administrador']), async (req, res) => {
  try {
    const statuses = await getManageableStatuses();
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuthContext, requireRole(['administrador']), async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    assertValidStatusPayload(payload);

    const existingStatus = await TicketStatus.findOne({ code: payload.code });

    if (existingStatus && !existingStatus.deletedAt) {
      return res.status(400).json({ error: 'Ya existe un estado con ese codigo' });
    }

    const status = existingStatus || new TicketStatus();
    Object.assign(status, payload, { deletedAt: null });
    await status.save();
    await refreshTicketStatusCache();

    res.status(201).json({
      message: 'Estado creado exitosamente',
      status,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un estado con ese codigo' });
    }

    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireAuthContext, requireRole(['administrador']), async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    assertValidStatusPayload(payload);

    const status = await TicketStatus.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      payload,
      { new: true, runValidators: true },
    );

    if (!status) {
      return res.status(404).json({ error: 'Estado no encontrado' });
    }

    await refreshTicketStatusCache();

    res.status(200).json({
      message: 'Estado actualizado exitosamente',
      status,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un estado con ese codigo' });
    }

    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAuthContext, requireRole(['administrador']), async (req, res) => {
  try {
    const status = await TicketStatus.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { isActive: false, deletedAt: new Date() },
      { new: true },
    );

    if (!status) {
      return res.status(404).json({ error: 'Estado no encontrado' });
    }

    invalidateTicketStatusCache();
    await refreshTicketStatusCache();

    res.status(200).json({
      message: 'Estado eliminado exitosamente',
      status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
