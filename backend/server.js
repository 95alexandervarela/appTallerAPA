require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const { ensureLocalSystemUser } = require("./bootstrap/ensureLocalSystemUser");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");
const recepcionEquipoRoutes = require("./routes/recepcionEquipo.routes");
const ticketRoutes = require("./routes/ticket.routes");
const diagnosticoTecnicoRoutes = require("./routes/diagnosticoTecnico.routes");
const validacionGarantiaRoutes = require("./routes/validacionGarantia.routes");
const gestionRepuestoRoutes = require("./routes/gestionRepuesto.routes");
const reparacionEquipoRoutes = require("./routes/reparacionEquipo.routes");
const cobroFacturacionRoutes = require("./routes/cobroFacturacion.routes");
const entregaEquipoRoutes = require("./routes/entregaEquipo.routes");
const configStatusRoutes = require("./routes/configStatus.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const notificationRoutes = require("./routes/notification.routes");

/**
 * Punto de entrada principal para el Servidor del Help Desk (Taller APA).
 *
 * @remarks
 * Este archivo inicializa la aplicación Express, establece la conexión con la base de datos MongoDB,
 * configura los middlewares de parsing de cuerpo JSON y CORS, registra las rutas de los módulos de la aplicación,
 * y define el manejo global de errores y rutas no encontradas (404).
 *
 * @module server
 */

const PORT = process.env.PORT || 3080;
const app = express();
// Middlewares globales
const allowedOrigins = new Set([
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "http://[::1]:4200",
  "http://localhost:3080",
  "https://hvvph486-4200.use2.devtunnels.ms",
]);

const privateNetworkOriginPattern =
  /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):4200$/;

/**
 * Valida origenes permitidos para desarrollo local del frontend Angular.
 *
 * @remarks
 * Evita errores CORS tipo `Http failure response ... status 0` cuando el
 * frontend se abre con `localhost`, `127.0.0.1`, IPv6 local o IP privada.
 */
const validateCorsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.has(origin) || privateNetworkOriginPattern.test(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origen CORS no permitido: ${origin}`));
};

app.use(
  cors({
    origin: validateCorsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Servidor del Help Desk (Taller APA) corriendo exitosamente.",
    version: "1.0.0",
    env: process.env.NODE_ENV || "development",
  });
});

// Registrar rutas modulares
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/config/statuses", configStatusRoutes);
app.use("/api/recepciones-equipo", recepcionEquipoRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/diagnosticos-tecnicos", diagnosticoTecnicoRoutes);
app.use("/api/validaciones-garantia", validacionGarantiaRoutes);
app.use("/api/gestiones-repuesto", gestionRepuestoRoutes);
app.use("/api/reparaciones-equipo", reparacionEquipoRoutes);
app.use("/api/cobros-facturacion", cobroFacturacionRoutes);
app.use("/api/entregas-equipo", entregaEquipoRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Middleware de manejo de errores globales
app.use((err, req, res, next) => {
  console.error(`Error de Servidor ${err.stack}`);
  res.status(500).json({ error: "Ocurrió un error interno en el servidor" });
});

/**
 * Inicializa MongoDB, bootstrap local y servidor HTTP en orden.
 *
 * @remarks
 * Al clonar en otra PC, el bootstrap de desarrollo asegura el usuario
 * `sistemas` antes de aceptar peticiones de login.
 */
async function startServer() {
  await connectDB();
  await ensureLocalSystemUser();

  app.listen(PORT, () => {
    console.log(
      `[Server] Servidor backend escuchando en el puerto: http://localhost:${PORT}`,
    );
  });
}

startServer();
