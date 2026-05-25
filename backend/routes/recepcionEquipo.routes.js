const express = require('express');
const router = express.Router();
const RecepcionEquipo = require('../models/recepcionEquipo.model');

/**
 * Enrutador de Express para el recurso de recepcion de equipos.
 *
 * Base Path: `/api/recepciones-equipo`
 */
router.post('/', async (req, res) => {
  try {
    const recepcion = new RecepcionEquipo(req.body);
    await recepcion.save();

    res.status(201).json({
      message: 'Recepcion de equipo registrada exitosamente',
      recepcion
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El numero de caso ya esta registrado' });
    }

    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const recepciones = await RecepcionEquipo.find({ activo: true, fechaEliminacion: null })
      .populate('recibidoPor', 'username nombre_completo email rol_id')
      .populate('autorizadoPor', 'username nombre_completo email rol_id')
      .sort({ fechaIngreso: -1 });

    res.status(200).json(recepciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const recepcion = await RecepcionEquipo.findOne({
      _id: req.params.id,
      activo: true,
      fechaEliminacion: null
    })
      .populate('recibidoPor', 'username nombre_completo email rol_id')
      .populate('autorizadoPor', 'username nombre_completo email rol_id');

    if (!recepcion) {
      return res.status(404).json({ error: 'Recepcion de equipo no encontrada' });
    }

    res.status(200).json(recepcion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const recepcion = await RecepcionEquipo.findOne({
      _id: req.params.id,
      activo: true,
      fechaEliminacion: null
    });

    if (!recepcion) {
      return res.status(404).json({ error: 'Recepcion de equipo no encontrada' });
    }

    const camposEditables = [
      'origenEquipo',
      'nombreCliente',
      'telefonoCliente',
      'correoCliente',
      'sucursalOrigen',
      'tipoEquipo',
      'marcaEquipo',
      'modeloEquipo',
      'serieEquipo',
      'fallaReportada',
      'condicionFisica',
      'accesoriosEntregados',
      'datosCompletos',
      'esCasoEspecial',
      'motivoCasoEspecial',
      'ingresoAutorizado',
      'motivoRechazo',
      'referenciaSap',
      'comprobanteEntregado',
      'equipoEtiquetado',
      'estadoRecepcion',
      'autorizadoPor',
      'fechaEnvioTaller'
    ];

    camposEditables.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        recepcion[campo] = req.body[campo];
      }
    });

    await recepcion.save();

    res.status(200).json({
      message: 'Recepcion de equipo actualizada exitosamente',
      recepcion
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const recepcion = await RecepcionEquipo.findOne({
      _id: req.params.id,
      activo: true,
      fechaEliminacion: null
    });

    if (!recepcion) {
      return res.status(404).json({ error: 'Recepcion de equipo no encontrada' });
    }

    recepcion.activo = false;
    recepcion.estadoRecepcion = 'equipo_no_ingresado';
    recepcion.motivoRechazo = req.body?.motivoRechazo || recepcion.motivoRechazo;
    recepcion.fechaEliminacion = Date.now();

    await recepcion.save();

    res.status(200).json({
      message: 'Recepcion de equipo cancelada exitosamente'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
