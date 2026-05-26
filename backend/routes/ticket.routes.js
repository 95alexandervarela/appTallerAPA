const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket.model');
const RecepcionEquipo = require('../models/recepcionEquipo.model');
const Usuario = require('../models/user.model');
const Rol = require('../models/role.model');
const { requireAuthContext, requireRole } = require('../middleware/authContext.middleware');
const { TicketStateAction, applyTicketState } = require('../services/ticketState.service');

const LEGACY_TECNICO_ROLE_ID = '6a126c9296a6e0cb6e9df8a4';
const TECHNICIAN_STATUS_UPDATES = new Set([
  'en_diagnostico',
  'diagnosticado',
  'espera_repuesto',
  'listo_para_reparacion',
  'en_reparacion',
  'reparado_servicio_finalizado',
]);

const getTecnicoRoleIds = async () => {
  const rolTecnico = await Rol.findOne({ codigo: 'tecnico', activo: true });
  const roleIds = [LEGACY_TECNICO_ROLE_ID];

  if (rolTecnico) {
    roleIds.push(rolTecnico._id);
  }

  return roleIds;
};

const populateTicket = (query) =>
  query
    .populate('recepcionEquipoId')
    .populate('creadoPor', 'username nombre_completo email rol_id')
    .populate('tecnicoAsignado', 'username nombre_completo email rol_id');

const getTicketTechnicianId = (ticket) => {
  if (!ticket.tecnicoAsignado) return '';
  return String(ticket.tecnicoAsignado._id || ticket.tecnicoAsignado);
};

const isAssignedToAuthenticatedTechnician = (ticket, authUser) =>
  getTicketTechnicianId(ticket) === authUser.id;

/**
 * Enrutador de Express para tickets de taller.
 *
 * Base Path: `/api/tickets`
 */
router.post('/', requireAuthContext, async (req, res) => {
  try {
    const { recepcionEquipoId } = req.body;

    if (!recepcionEquipoId) {
      return res.status(400).json({ error: 'La recepcion de equipo es requerida' });
    }

    const recepcion = await RecepcionEquipo.findById(recepcionEquipoId);

    if (!recepcion) {
      return res.status(404).json({ error: 'Recepcion de equipo no encontrada' });
    }

    const ticket = new Ticket({
      numeroTicket: req.body.numeroTicket,
      recepcionEquipoId: recepcion._id,
      numeroCasoRecepcion: recepcion.numeroCaso,
      creadoPor: req.body.creadoPor || req.authUser.id,
      tecnicoAsignado: req.body.tecnicoAsignado,
      prioridad: req.body.prioridad,
      estadoTicket: req.body.estadoTicket,
      nombreCliente: recepcion.nombreCliente,
      telefonoCliente: recepcion.telefonoCliente,
      tipoEquipo: recepcion.tipoEquipo,
      marcaEquipo: recepcion.marcaEquipo,
      modeloEquipo: recepcion.modeloEquipo,
      serieEquipo: recepcion.serieEquipo,
      fallaReportada: recepcion.fallaReportada,
      condicionFisica: recepcion.condicionFisica,
      accesoriosEntregados: recepcion.accesoriosEntregados,
      diagnosticoInicial: req.body.diagnosticoInicial,
      observacionesAsignacion: req.body.observacionesAsignacion
    });

    await ticket.save();

    res.status(201).json({
      message: 'Ticket creado exitosamente',
      ticket
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El numero de ticket ya esta registrado' });
    }

    res.status(400).json({ error: error.message });
  }
});

router.get('/', requireAuthContext, async (req, res) => {
  try {
    const query = { activo: true };

    if (req.authUser.roleCode === 'tecnico') {
      query.tecnicoAsignado = req.authUser.id;
    }

    const tickets = await populateTicket(Ticket.find(query)).sort({ fechaCreacion: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Lista tickets visibles para el usuario autenticado.
 *
 * @remarks
 * Para Tecnico filtra en backend por `tecnicoAsignado`. Administrador conserva
 * acceso global. Este endpoint prepara el contrato definitivo `/my-tickets`.
 */
router.get('/my-tickets', requireAuthContext, async (req, res) => {
  try {
    const query = { activo: true };

    if (req.authUser.roleCode === 'tecnico') {
      query.tecnicoAsignado = req.authUser.id;
    }

    const tickets = await populateTicket(Ticket.find(query)).sort({ fechaCreacion: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  '/tecnicos-disponibles',
  requireAuthContext,
  requireRole(['administrador']),
  async (req, res) => {
  try {
    const tecnicoRoleIds = await getTecnicoRoleIds();

    const tecnicos = await Usuario.find(
      { rol_id: { $in: tecnicoRoleIds }, activo: true },
      '-passwordHash'
    ).sort({ nombre_completo: 1 });

    res.status(200).json(tecnicos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requireAuthContext, async (req, res) => {
  try {
    const ticket = await populateTicket(Ticket.findById(req.params.id));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (
      req.authUser.roleCode === 'tecnico' &&
      !isAssignedToAuthenticatedTechnician(ticket, req.authUser)
    ) {
      return res.status(403).json({ error: 'No puedes ver tickets de otro tecnico' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireAuthContext, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (
      req.authUser.roleCode === 'tecnico' &&
      !isAssignedToAuthenticatedTechnician(ticket, req.authUser)
    ) {
      return res.status(403).json({ error: 'No puedes modificar tickets de otro tecnico' });
    }

    if (req.authUser.roleCode === 'tecnico') {
      const requestedFields = Object.keys(req.body);
      const onlyStatusUpdate =
        requestedFields.length === 1 && requestedFields[0] === 'estadoTicket';

      if (!onlyStatusUpdate || !TECHNICIAN_STATUS_UPDATES.has(req.body.estadoTicket)) {
        return res.status(403).json({ error: 'Cambio no permitido para perfil Tecnico' });
      }
    }

    const camposEditables = [
      'tecnicoAsignado',
      'prioridad',
      'diagnosticoInicial',
      'observacionesAsignacion',
      'fechaInicioDiagnostico',
      'fechaCierre',
      'activo'
    ];

    camposEditables.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        ticket[campo] = req.body[campo];
      }
    });

    await ticket.save();

    if (req.body.estadoTicket !== undefined) {
      await applyTicketState(ticket._id, TicketStateAction.MANUAL_STATUS_UPDATE, {
        estadoTicket: req.body.estadoTicket,
        changedBy: req.authUser.id,
        comment: 'Estado actualizado desde PUT /api/tickets/:id'
      });
    }

    const ticketActualizado = await populateTicket(Ticket.findById(ticket._id));

    res.status(200).json({
      message: 'Ticket actualizado exitosamente',
      ticket: ticketActualizado
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Actualiza el estado operativo de un ticket para el flujo de Tecnico.
 *
 * @remarks
 * Restringe al Tecnico a sus tickets asignados y a estados operativos
 * permitidos. No permite cierres administrativos desde este flujo.
 */
router.patch('/:id/status', requireAuthContext, async (req, res) => {
  try {
    const { estadoTicket } = req.body;

    if (!TECHNICIAN_STATUS_UPDATES.has(estadoTicket)) {
      return res.status(400).json({ error: 'Estado no permitido para actualizacion tecnica' });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (
      req.authUser.roleCode === 'tecnico' &&
      !isAssignedToAuthenticatedTechnician(ticket, req.authUser)
    ) {
      return res.status(403).json({ error: 'No puedes cambiar tickets de otro tecnico' });
    }

    await applyTicketState(ticket._id, TicketStateAction.MANUAL_STATUS_UPDATE, {
      estadoTicket,
      changedBy: req.authUser.id,
      comment: 'Estado actualizado desde PATCH /api/tickets/:id/status'
    });

    const ticketActualizado = await populateTicket(Ticket.findById(ticket._id));

    res.status(200).json({
      message: 'Estado actualizado exitosamente',
      ticket: ticketActualizado,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put(
  '/:id/asignar-tecnico',
  requireAuthContext,
  requireRole(['administrador']),
  async (req, res) => {
  try {
    const { tecnicoAsignado, observacionesAsignacion } = req.body;

    if (!tecnicoAsignado) {
      return res.status(400).json({ error: 'El tecnico asignado es requerido' });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const tecnicoRoleIds = await getTecnicoRoleIds();

    const tecnico = await Usuario.findOne({
      _id: tecnicoAsignado,
      rol_id: { $in: tecnicoRoleIds },
      activo: true
    });

    if (!tecnico) {
      return res.status(404).json({ error: 'Tecnico no encontrado o no activo' });
    }

    const shouldMarkAssigned = ticket.estadoTicket === 'creado';
    ticket.tecnicoAsignado = tecnico._id;
    ticket.observacionesAsignacion = observacionesAsignacion || ticket.observacionesAsignacion;
    ticket.fechaAsignacion = Date.now();

    await ticket.save();

    if (shouldMarkAssigned) {
      await applyTicketState(ticket._id, TicketStateAction.TECNICO_ASIGNADO, {
        changedBy: req.authUser.id,
        comment: 'Tecnico asignado al ticket'
      });
    }

    const ticketActualizado = await Ticket.findById(ticket._id)
      .populate('recepcionEquipoId')
      .populate('creadoPor', 'username nombre_completo email rol_id')
      .populate('tecnicoAsignado', 'username nombre_completo email rol_id');

    res.status(200).json({
      message: 'Tecnico asignado exitosamente',
      ticket: ticketActualizado
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
