const express = require('express');

/**
 * Crea rutas CRUD basicas para modulos operativos del taller.
 *
 * @param {import('mongoose').Model} Model Modelo de Mongoose.
 * @param {object} options Opciones de configuracion.
 * @param {string} options.resourceName Nombre legible del recurso.
 * @param {Array<string|object>} [options.populate] Campos a poblar en las consultas.
 * @param {Function} [options.afterCreate] Callback despues de crear el documento.
 * @param {Function} [options.afterUpdate] Callback despues de actualizar el documento.
 * @returns {import('express').Router}
 */
function createCrudRouter(Model, { resourceName, populate = [], afterCreate, afterUpdate }) {
  const router = express.Router();

  const applyPopulate = (query) =>
    populate.reduce((currentQuery, field) => currentQuery.populate(field), query);
  const hasPath = (pathName) => Boolean(Model.schema.path(pathName));
  const activeFilter = () => {
    const filter = {};

    if (hasPath('activo')) filter.activo = true;
    if (hasPath('fechaEliminacion')) filter.fechaEliminacion = null;

    return filter;
  };
  const sortByCreation = () => (hasPath('fechaCreacion') ? { fechaCreacion: -1 } : { _id: -1 });

  router.post('/', async (req, res) => {
    try {
      const document = new Model(req.body);
      await document.save();

      if (afterCreate) {
        await afterCreate(document, req);
      }

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
        Model.find(activeFilter()).sort(sortByCreation())
      );

      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const document = await applyPopulate(
        Model.findOne({ _id: req.params.id, ...activeFilter() })
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
        ...activeFilter()
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

      if (afterUpdate) {
        await afterUpdate(document, req);
      }

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
        ...activeFilter()
      });

      if (!document) {
        return res.status(404).json({ error: `${resourceName} no encontrado` });
      }

      if (hasPath('activo')) document.activo = false;
      if (hasPath('fechaEliminacion')) document.fechaEliminacion = Date.now();

      if (!hasPath('activo') && !hasPath('fechaEliminacion')) {
        return res.status(400).json({
          error: `${resourceName} no soporta baja logica segura`
        });
      }

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
