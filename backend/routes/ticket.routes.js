const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket.model');
const RecepcionEquipo = require('../models/recepcionEquipo.model');

/**
 * Enrutador de Express para tickets de taller.
 *
 * Base Path: `/api/tickets`
 */
router.post('/', async (req, res) => {
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
      creadoPor: req.body.creadoPor,
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

router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find({ activo: true })
      .populate('recepcionEquipoId')
      .populate('creadoPor', 'username nombre_completo email rol_id')
      .populate('tecnicoAsignado', 'username nombre_completo email rol_id')
      .sort({ fechaCreacion: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('recepcionEquipoId')
      .populate('creadoPor', 'username nombre_completo email rol_id')
      .populate('tecnicoAsignado', 'username nombre_completo email rol_id');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const camposEditables = [
      'tecnicoAsignado',
      'prioridad',
      'estadoTicket',
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

    res.status(200).json({
      message: 'Ticket actualizado exitosamente',
      ticket
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
