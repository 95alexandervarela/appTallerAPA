const Usuario = require("../models/user.model");

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

    console.log("📨 Datos recibidos:", {
      username,
      email,
      nombre_completo,
      rol_id,
      password: password ? "✓" : "✗",
    });

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
      console.log("❌ Error: falta contraseña");
      return res.status(400).json({ error: "La contraseña es requerida" });
    }

    if (!rol_id || !rol_id.trim()) {
      return res.status(400).json({ error: "El rol es requerido" });
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
      passwordHash: rawPassword, // Se hasheará en el hook pre('save') del modelo
      nombre_completo,
      rol_id,
    });

    await newUser.save();

    // Retornar el usuario sin la contraseña
    const responseUser = newUser.toObject();
    delete responseUser.passwordHash;

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: responseUser,
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
    // El middleware pre('find') del modelo filtra automáticamente fecha_eliminacion: null
    const users = await Usuario.find({}, "-passwordHash");
    res.status(200).json(users);
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
    const user = await Usuario.findById(req.params.id, "-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json(user);
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
 * Si se incluye una nueva contraseña (campo `password` o `passwordHash`), el pre-hook del
 * modelo se encarga de volver a computar el hash criptográfico.
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
      passwordHash,
      password,
      nombre_completo,
      rol_id,
      activo,
    } = req.body;

    const user = await Usuario.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
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

    // Si se envía una nueva contraseña, actualizarla (el pre-hook save la hasheará)
    const newPassword = password || passwordHash;
    if (newPassword) {
      user.passwordHash = newPassword;
    }

    await user.save();

    const responseUser = user.toObject();
    delete responseUser.passwordHash;

    res.status(200).json({
      message: "Usuario actualizado exitosamente",
      user: responseUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Elimina definitivamente un usuario del sistema.
 *
 * @remarks
 * Borra físicamente el documento de MongoDB para liberar los índices únicos de
 * `username` y `email`, permitiendo volver a registrar el mismo usuario si fuera necesario.
 *
 * @async
 * @function deleteUser
 * @param {import('express').Request} req - Objeto de petición HTTP de Express con el ID en `req.params.id`.
 * @param {import('express').Response} res - Objeto de respuesta HTTP de Express.
 * @returns {Promise<void>} Envía código de estado 200 en caso de éxito.
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await Usuario.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await Usuario.deleteOne({ _id: req.params.id });

    res.status(200).json({
      message: "Usuario eliminado definitivamente del sistema",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
