const Rol = require('../models/role.model');

const baseRoles = [
  {
    codigo: 'tecnico',
    nombre: 'Tecnico',
    permisos: ['ordenes:ver', 'ordenes:trabajar']
  },
  {
    codigo: 'supervisor',
    nombre: 'Supervisor',
    permisos: ['ordenes:ver', 'ordenes:asignar', 'usuarios:ver']
  },
  {
    codigo: 'administrador',
    nombre: 'Administrador',
    permisos: ['usuarios:gestionar', 'roles:gestionar', 'ordenes:gestionar']
  }
];

/**
 * Crea o actualiza los roles base del sistema.
 *
 * @remarks
 * Este metodo es idempotente: se puede ejecutar varias veces sin duplicar registros.
 */
exports.seedRoles = async (req, res) => {
  try {
    const roles = await Promise.all(
      baseRoles.map((role) =>
        Rol.findOneAndUpdate(
          { codigo: role.codigo },
          { ...role, activo: true, fecha_actualizacion: Date.now() },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        )
      )
    );

    res.status(200).json({
      message: 'Roles base configurados correctamente',
      roles
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Lista los roles activos disponibles para formularios y asignacion de usuarios.
 */
exports.getRoles = async (req, res) => {
  try {
    const roles = await Rol.find({ activo: true }).sort({ nombre: 1 });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Crea un rol nuevo cuando el sistema requiera ampliar permisos.
 */
exports.createRole = async (req, res) => {
  try {
    const { codigo, nombre, permisos = [], activo = true } = req.body;

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({ error: 'El codigo del rol es requerido' });
    }

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del rol es requerido' });
    }

    const role = new Rol({
      codigo,
      nombre,
      permisos,
      activo
    });

    await role.save();

    res.status(201).json({
      message: 'Rol creado exitosamente',
      role
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El codigo del rol ya esta registrado' });
    }

    res.status(400).json({ error: error.message });
  }
};
