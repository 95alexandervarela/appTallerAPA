const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuthContext, requireRole } = require('../middleware/authContext.middleware');

const requireAdminUser = [requireAuthContext, requireRole(['administrador'])];
const requirePasswordChangeUser = [requireAuthContext, requireRole(['administrador', 'manager'])];

/**
 * Enrutador de Express para el recurso de Usuarios.
 *
 * @remarks
 * Define los endpoints REST para la gestión (CRUD) de usuarios del taller, mapeando
 * las rutas directamente a los métodos correspondientes expuestos en el controlador.
 *
 * Base Path: `/api/users`
 *
 * @module routes/user
 */

/**
 * @name POST /
 * @description Crea un nuevo usuario en el sistema.
 */
router.post('/', requireAdminUser, userController.createUser);

/**
 * @name GET /
 * @description Recupera la lista de todos los usuarios activos (no eliminados lógicamente).
 */
router.get('/', requireAdminUser, userController.getUsers);

/**
 * @name POST /change-password
 * @description Cambia la contraseña del usuario autenticado tras validar la contraseña actual.
 */
router.post('/change-password', requirePasswordChangeUser, userController.changePassword);

/**
 * @name PATCH /:id/change-password
 * @description Cambia la contraseña de un usuario desde gestión administrativa.
 */
router.patch('/:id/change-password', requirePasswordChangeUser, userController.changeUserPassword);

/**
 * @name GET /:id
 * @description Recupera la información detallada de un usuario activo por su ID.
 */
router.get('/:id', requireAdminUser, userController.getUserById);

/**
 * @name PUT /:id
 * @description Actualiza los datos generales de un usuario activo (incluyendo su contraseña).
 */
router.put('/:id', requireAdminUser, userController.updateUser);

/**
 * @name DELETE /:id
 * @description Aplica una baja lógica (Soft Delete) al usuario indicado por ID.
 */
router.delete('/:id', requireAdminUser, userController.deleteUser);

module.exports = router;
