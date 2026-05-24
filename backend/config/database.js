const mongoose = require("mongoose");

/**
 * Conecta a la base de datos MongoDB utilizando la URI configurada.
 *
 * @remarks
 * Utiliza la variable de entorno `MONGODB_URI`. Si no está definida,
 * realiza un fallback automático a la base de datos local `appTallerAPA`.
 * Si la conexión falla, el proceso de Node.js finalizará con código de salida 1.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Promesa que se resuelve cuando la conexión se establece con éxito.
 */
const connectDB = async () => {
  const dbUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/appTallerAPA";

  try {
    const conn = await mongoose.connect(dbUri);
    console.log(`[Database] MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(
      `[Database Error] Error al conectar a MongoDB: ${error.message}`,
    );
    process.exit(1); // Finalizar el proceso con fallo si no se puede conectar
  }
};

module.exports = connectDB;
