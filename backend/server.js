const express = require('express');
const connectDB = require('./config/database');
const userRoutes = require('./routes/user.routes');

/**
 * Punto de entrada principal para el Servidor del Help Desk (Taller APA).
 *
 * @remarks
 * Este archivo inicializa la aplicación Express, establece la conexión con la base de datos MongoDB,
 * configura los middlewares de parsing de cuerpo JSON, registra las rutas de los módulos de la aplicación,
 * y define el manejo global de errores y rutas no encontradas (404).
 *
 * @module server
 */

const PORT = process.env.PORT || 3080;
const app = express();
// Conectar a la base de datos MongoDB
connectDB();
// Middlewares globales
app.use(express.json());
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Servidor del Help Desk (Taller APA) corriendo exitosamente.',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  });
});

// Registrar rutas modulares
app.use('/api/users', userRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware de manejo de errores globales
app.use((err, req, res, next) => {
  console.error(`Error de Servidor ${err.stack}`);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`[Server] Servidor backend escuchando en el puerto: http://localhost:3${PORT}`);
});