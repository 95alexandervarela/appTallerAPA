const Usuario = require("../models/user.model");
const Rol = require("../models/role.model");
const { LEGACY_ROLE_FALLBACKS } = require("../services/authUser.service");

const ADMIN_ROLE_CODE = "administrador";
const MANAGER_ROLE_CODE = "manager";
const TECH_ROLE_CODE = "tecnico";
const UNKNOWN_ROLE_CODE = "desconocido";

const isAdminOrManager = (roleCode) =>
  roleCode === ADMIN_ROLE_CODE || roleCode === MANAGER_ROLE_CODE;

const getUserRoleId = (user) => {
  const populatedRoleId = typeof user?.populated === "function" ? user.populated("rol_id") : null;

  if (populatedRoleId) {
    return String(populatedRoleId);
  }

  if (user?.rol_id?._id) {
    return String(user.rol_id._id);
  }

  return user?.rol_id ? String(user.rol_id) : "";
};

const resolveRoleById = async (roleId) => {
  const normalizedRoleId = String(roleId || "");
  const fallbackRole = LEGACY_ROLE_FALLBACKS[normalizedRoleId];

  try {
    const role = await Rol.findById(normalizedRoleId);

    if (role) {
      return {
        roleId: String(role._id),
        roleCode: role.codigo,
        roleName: role.nombre,
      };
    }
  } catch (error) {
    // Si el ObjectId no es valido, el fallback decide si es un rol historico conocido.
  }

  return {
    roleId: normalizedRoleId,
    roleCode: fallbackRole?.codigo || UNKNOWN_ROLE_CODE,
    roleName: fallbackRole?.nombre || "Desconocido",
  };
};

const getUserRolePayload = (user) => {
  const roleId = getUserRoleId(user);
  const populatedRole = user?.rol_id?.codigo ? user.rol_id : null;
  const fallbackRole = LEGACY_ROLE_FALLBACKS[roleId];

  return {
    roleId,
    roleCode: populatedRole?.codigo || fallbackRole?.codigo || UNKNOWN_ROLE_CODE,
    roleName: populatedRole?.nombre || fallbackRole?.nombre || "Desconocido",
  };
};

const canViewUser = (requesterRoleCode, targetRoleCode) => {
  if (requesterRoleCode === MANAGER_ROLE_CODE) return true;
  if (requesterRoleCode === ADMIN_ROLE_CODE) return targetRoleCode !== MANAGER_ROLE_CODE;

  return false;
};

const canModifyUser = (requesterRoleCode, targetRoleCode) => {
  if (requesterRoleCode === MANAGER_ROLE_CODE) return true;
  if (requesterRoleCode === ADMIN_ROLE_CODE) return targetRoleCode === TECH_ROLE_CODE;

  return false;
};

const canAssignRole = (requesterRoleCode, targetRoleCode) => {
  if (requesterRoleCode === MANAGER_ROLE_CODE) return true;
  if (requesterRoleCode === ADMIN_ROLE_CODE) return targetRoleCode === TECH_ROLE_CODE;

  return false;
};

const buildUserResponse = (user) => {
  const responseUser = user.toObject();
  const role = getUserRolePayload(user);

  delete responseUser.passwordHash;
  responseUser.rol_id = role.roleId;
  responseUser.roleId = role.roleId;
  responseUser.roleCode = role.roleCode;
  responseUser.roleName = role.roleName;

  return responseUser;
};

/**
 * Crea un nuevo usuario en el sistema.
 *
 * @remarks
 * Este controlador procesa las solicitudes POST de creación de usuario.
 * Acepta tanto `password` como `passwordHash` en el cuerpo de la petición.
 * Verifica previamente la existencia del `username` y `email` en la base de datos
 * para evitar registros duplicados. El hasheo se delega automáticamente al modelo.
 *
 * @async
 * @function createUser
 * @param {import('express').Request} req - Objeto de petición HTTP de Express que contiene los datos del usuario en `req.body`.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @returns {Promise<void>} Envía código de estado 201 en caso de éxito con el objeto de usuario (sin passwordHash) o 400 en caso de error.
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, passwordHash, password, nombre_completo, rol_id } =
      req.body;

    // Acepta tanto 'password' como 'passwordHash' del cuerpo para mayor flexibilidad
    const rawPassword = password || passwordHash;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "El nombre de usuario es requerido" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "El correo electrónico es requerido" });
    }

    if (!nombre_completo || !nombre_completo.trim()) {
      return res.status(400).json({ error: "El nombre completo es requerido" });
    }

    if (!rawPassword) {
      return res.status(400).json({ error: "La contraseña es requerida" });
    }

    if (!rol_id || !rol_id.trim()) {
      return res.status(400).json({ error: "El rol es requerido" });
    }

    const requestedRole = await resolveRoleById(rol_id);

    if (requestedRole.roleCode === UNKNOWN_ROLE_CODE) {
      return res.status(400).json({ error: "El rol seleccionado no es válido" });
    }

    if (!canAssignRole(req.authUser?.roleCode, requestedRole.roleCode)) {
      return res.status(403).json({ error: "Operación no permitida" });
    }

    const duplicateQuery = {
      $or: [
        { username: username.toLowerCase().trim() },
        { email: email.toLowerCase().trim() },
      ],
    };

    // Limpiar registros viejos eliminados logicamente para liberar indices unicos.
    await Usuario.collection.deleteMany({
      ...duplicateQuery,
      fecha_eliminacion: { $ne: null },
    });

    // Buscar directo en la coleccion para detectar registros activos duplicados.
    const existingUser = await Usuario.collection.findOne(duplicateQuery);

    if (existingUser) {
      if (existingUser.username === username.toLowerCase().trim()) {
        return res
          .status(400)
          .json({ error: "El nombre de usuario ya está registrado" });
      }

      if (existingUser.email === email.toLowerCase().trim()) {
        return res
          .status(400)
          .json({ error: "El correo electrónico ya está registrado" });
      }
    }

    const newUser = new Usuario({
      username,
      email,
      nombre_completo,
      rol_id,
    });
    newUser.setPassword(rawPassword);

    await newUser.save();
    await newUser.populate("rol_id", "codigo nombre");

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0];
      const duplicatedLabel =
        duplicatedField === "username" ? "nombre de usuario" : "correo electrónico";

      return res.status(400).json({
        error: `El ${duplicatedLabel} ya está registrado`,
      });
    }

    res.status(400).json({ error: error.message });
  }
};

/**
 * Obtiene todos los usuarios activos del sistema.
 *
 * @remarks
 * Retorna un listado de todos los usuarios registrados que no han sido eliminados lógicamente.
 * Excluye automáticamente el campo `passwordHash` por razones de seguridad.
 *
 * @async
 * @function getUsers
 * @param {import('express').Request} req - Objeto de petición HTTP de Express.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @returns {Promise<void>} Envía código de estado 200 con la lista de usuarios en formato JSON.
 */
exports.getUsers = async (req, res) => {
  try {
    if (!isAdminOrManager(req.authUser?.roleCode)) {
      return res.status(403).json({ error: "Acceso restringido" });
    }

    // El middleware pre('find') del modelo filtra automáticamente fecha_eliminacion: null
    const users = await Usuario.find({}, "-passwordHash").populate("rol_id", "codigo nombre");
    const visibleUsers = users.filter((user) =>
      canViewUser(req.authUser.roleCode, getUserRolePayload(user).roleCode),
    );

    res.status(200).json(visibleUsers.map(buildUserResponse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene el detalle de un usuario activo específico por su identificador.
 *
 * @remarks
 * Busca un único usuario por su `_id` proporcionado en los parámetros de la ruta (`req.params.id`).
 * Si el usuario fue eliminado lógicamente, el query middleware del modelo evitará que sea retornado.
 *
 * @async
 * @function getUserById
 * @param {import('express').Request} req - Objeto de petición HTTP de Express con el ID en `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @returns {Promise<void>} Envía código de estado 200 si es encontrado, o 404 si el usuario no existe.
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await Usuario.findById(req.params.id, "-passwordHash").populate("rol_id", "codigo nombre");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!canViewUser(req.authUser?.roleCode, getUserRolePayload(user).roleCode)) {
      return res.status(403).json({ error: "Acceso restringido" });
    }

    res.status(200).json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Actualiza los datos de un usuario activo existente.
 *
 * @remarks
 * Modifica selectivamente los campos proveídos en el cuerpo de la petición.
 * Realiza comprobaciones de duplicados si se intenta modificar el `username` o `email`.
 * La contraseña se cambia exclusivamente mediante el endpoint dedicado de cambio
 * de contraseña.
 *
 * @async
 * @function updateUser
 * @param {import('express').Request} req - Objeto de petición HTTP de Express con el ID en `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @returns {Promise<void>} Envía código de estado 200 con los datos actualizados del usuario en formato JSON.
 */
exports.updateUser = async (req, res) => {
  try {
    const {
      username,
      email,
      nombre_completo,
      rol_id,
      activo,
    } = req.body;

    const user = await Usuario.findById(req.params.id).populate("rol_id", "codigo nombre");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const targetRole = getUserRolePayload(user);

    if (!canModifyUser(req.authUser?.roleCode, targetRole.roleCode)) {
      return res.status(403).json({ error: "No tienes permisos para modificar este usuario" });
    }

    if (rol_id !== undefined) {
      const requestedRole = await resolveRoleById(rol_id);

      if (requestedRole.roleCode === UNKNOWN_ROLE_CODE) {
        return res.status(400).json({ error: "El rol seleccionado no es válido" });
      }

      if (!canAssignRole(req.authUser?.roleCode, requestedRole.roleCode)) {
        return res.status(403).json({ error: "Operación no permitida" });
      }
    }

    // Validar duplicados si se va a actualizar username o email
    if (username && username.toLowerCase().trim() !== user.username) {
      const duplicateUsername = await Usuario.findOne({
        username: username.toLowerCase().trim(),
      });
      if (duplicateUsername) {
        return res
          .status(400)
          .json({ error: "El nombre de usuario ya está en uso" });
      }
      user.username = username;
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const duplicateEmail = await Usuario.findOne({
        email: email.toLowerCase().trim(),
      });
      if (duplicateEmail) {
        return res
          .status(400)
          .json({ error: "El correo electrónico ya está en uso" });
      }
      user.email = email;
    }

    // Actualizar otros campos
    if (nombre_completo !== undefined) user.nombre_completo = nombre_completo;
    if (rol_id !== undefined) user.rol_id = rol_id;
    if (activo !== undefined) user.activo = activo;

    await user.save();
    await user.populate("rol_id", "codigo nombre");

    res.status(200).json({
      message: "Usuario actualizado exitosamente",
      user: buildUserResponse(user),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Cambia la contraseña del usuario autenticado.
 *
 * @remarks
 * Requiere validar la contraseña actual y se expone solo para Administrador y Manager.
 *
 * @async
 * @function changePassword
 * @param {import('express').Request} req - Petición HTTP con `currentPassword` y `newPassword`.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Envía código 200 si el cambio fue aplicado.
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Contraseña actual y nueva contraseña son requeridas" });
    }

    const user = req.authUserDocument;

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!user.comparePassword(currentPassword)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    user.setPassword(newPassword);
    await user.save();

    res.status(200).json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Cambia la contraseña de un usuario indicado por ID.
 *
 * @remarks
 * Administrador y Manager pueden restablecer contraseñas desde gestión de usuarios.
 * Si se recibe `currentPassword`, se valida contra el usuario destino antes de aplicar el cambio.
 *
 * @async
 * @function changeUserPassword
 * @param {import('express').Request} req - Petición HTTP con `newPassword` y opcionalmente `currentPassword`.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Envía código 200 si el cambio fue aplicado.
 */
exports.changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    const canManagePasswords = isAdminOrManager(req.authUser?.roleCode);

    if (req.authUser?.id !== userId && !canManagePasswords) {
      return res.status(403).json({ error: "No tienes permisos para cambiar esta contraseña" });
    }

    if (!newPassword) {
      return res.status(400).json({ error: "La nueva contraseña es requerida" });
    }

    const user = await Usuario.findById(userId).populate("rol_id", "codigo nombre");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!canModifyUser(req.authUser?.roleCode, getUserRolePayload(user).roleCode)) {
      return res.status(403).json({ error: "No tienes permisos para modificar este usuario" });
    }

    if ((!canManagePasswords || currentPassword) && !user.comparePassword(currentPassword)) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    user.setPassword(newPassword);
    await user.save();

    res.status(200).json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Aplica baja logica a un usuario del sistema.
 *
 * @remarks
 * No borra fisicamente el documento: marca `activo = false` y registra
 * `fecha_eliminacion` para conservar trazabilidad y auditoria.
 *
 * @async
 * @function deleteUser
 * @param {import('express').Request} req - Objeto de petición HTTP de Express con el ID en `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @returns {Promise<void>} Envía código de estado 200 en caso de éxito.
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await Usuario.findById(req.params.id).populate("rol_id", "codigo nombre");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!canModifyUser(req.authUser?.roleCode, getUserRolePayload(user).roleCode)) {
      return res.status(403).json({ error: "No tienes permisos para eliminar este usuario" });
    }

    user.activo = false;
    user.fecha_eliminacion = new Date();
    await user.save();

    res.status(200).json({
      message: "Usuario eliminado logicamente del sistema",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
