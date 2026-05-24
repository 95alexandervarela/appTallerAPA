const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');

/**
 * Enrutador de Express para el recurso de Roles.
 *
 * Base Path: `/api/roles`
 */
router.get('/', roleController.getRoles);
router.post('/', roleController.createRole);
router.post('/seed', roleController.seedRoles);

module.exports = router;
