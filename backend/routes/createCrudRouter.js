const express = require('express');

/**
 * Crea rutas CRUD basicas para modulos operativos del taller.
 *
 * @param {import('mongoose').Model} Model Modelo de Mongoose.
 * @param {object} options Opciones de configuracion.
 * @param {string} options.resourceName Nombre legible del recurso.
 * @param {string[]} [options.populate] Campos a poblar en las consultas.
 * @returns {import('express').Router}
 */
function createCrudRouter(Model, { resourceName, populate = [] }) {
  const router = express.Router();

  const applyPopulate = (query) =>
    populate.reduce((currentQuery, field) => currentQuery.populate(field), query);

  router.post('/', async (req, res) => {
    try {
      const document = new Model(req.body);
      await document.save();

      res.status(201).json({
        message: `${resourceName} registrado exitosamente`,
        data: document
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const documents = await applyPopulate(
        Model.find({ activo: true, fechaEliminacion: null }).sort({ fechaCreacion: -1 })
      );

      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const document = await applyPopulate(
        Model.findOne({ _id: req.params.id, activo: true, fechaEliminacion: null })
      );

      if (!document) {
        return res.status(404).json({ error: `${resourceName} no encontrado` });
      }

      res.status(200).json(document);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const document = await Model.findOne({
        _id: req.params.id,
        activo: true,
        fechaEliminacion: null
      });

      if (!document) {
        return res.status(404).json({ error: `${resourceName} no encontrado` });
      }

      Object.keys(req.body).forEach((key) => {
        if (!['_id', 'fechaCreacion', 'fechaEliminacion'].includes(key)) {
          document[key] = req.body[key];
        }
      });

      await document.save();

      res.status(200).json({
        message: `${resourceName} actualizado exitosamente`,
        data: document
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const document = await Model.findOne({
        _id: req.params.id,
        activo: true,
        fechaEliminacion: null
      });

      if (!document) {
        return res.status(404).json({ error: `${resourceName} no encontrado` });
      }

      document.activo = false;
      document.fechaEliminacion = Date.now();
      await document.save();

      res.status(200).json({
        message: `${resourceName} eliminado exitosamente`
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
