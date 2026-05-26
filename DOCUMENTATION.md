# Documentacion del Proyecto

## Sistema de Tipografía

El frontend usa un sistema tipografico global inspirado en Microsoft Fluent Design. El objetivo es mantener una interfaz consistente, legible y preparada para crecer hacia pantallas densas como dashboards, bandejas de tickets y modulos administrativos.

### Estandar aplicado

La configuracion vive en:

```text
frontend/src/styles.scss
```

Fuente principal para interfaz:

```scss
font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
```

Fuente para codigo o datos tecnicos:

```scss
font-family: "Cascadia Code", Consolas, monospace;
```

Jerarquia tipografica:

- `body`: fuente UI global y `font-weight: 400`.
- `h1`, `h2`, `h3`: fuente UI y `font-weight: 600`.
- `label`, `button`, `input`, `textarea`, `select`: heredan el estandar UI.
- `code`, `kbd`, `pre`, `samp`: usan fuente monoespaciada tecnica.

### Compatibilidad en Linux

`Segoe UI` y `Cascadia Code` pueden no estar disponibles por defecto en Fedora. Por eso el stack incluye fallbacks locales:

- UI: `Helvetica Neue`, `Arial`, `sans-serif`.
- Codigo: `Consolas`, `monospace`.

No se usan fuentes externas por CDN. Esto mantiene control local del sistema y evita dependencias visuales externas.

### Clases utilitarias

Usa estas clases cuando necesites aplicar el sistema tipografico de forma explicita:

```html
<p class="font-ui">Texto normal de interfaz.</p>
```

```html
<span class="font-code">APA-0017</span>
```

```html
<div class="text-title">Resumen de tickets</div>
```

### Extension futura

Antes de crear dashboards complejos, el siguiente paso recomendado es extender los tokens globales con:

- `--font-size-*`
- `--line-height-*`
- `--letter-spacing-*`
- `--font-weight-regular`
- `--font-weight-semibold`

Esto permitira mantener consistencia visual sin duplicar estilos dentro de componentes.

## Dashboard y Layout Principal

El dashboard interno sigue una arquitectura visual inspirada en Zoho Desk: un sidebar vertical fijo a la izquierda y un area principal de contenido a la derecha. La diferencia visual es que las superficies usan la estetica glass del login: fondo degradado, transparencias, bordes redondeados, blur y sombras suaves.

### Arquitectura

La estructura vive en:

```text
frontend/src/app/
  layout/
    layout.component.ts
    layout.component.html
    layout.component.scss
    sidebar.component.ts
    sidebar.component.html
    sidebar.component.scss
  features/home/
    home.component.ts
    home.component.html
    home.component.scss
  shared/components/
    card.component.ts
    card.component.html
    card.component.scss
```

Responsabilidades:

- `LayoutComponent`: define el shell principal con sidebar fijo y `router-outlet` interno.
- `SidebarComponent`: renderiza el menu vertical con `MenuModule` de PrimeNG.
- `HomeComponent`: contiene el dashboard con metricas, placeholders de graficas y widgets.
- `CardComponent`: card glass reutilizable para metricas.

### PrimeNG utilizado

Componentes usados:

- `MenuModule`: sidebar vertical.
- `CardModule`: metricas y widgets.
- `TagModule`: estados visuales.
- `ProgressBarModule`: avance de colas operativas.

Las graficas todavia son placeholders visuales. Cuando se agregue una libreria o integracion real, el bloque `chart-placeholder` puede reemplazarse por un componente de chart sin cambiar el layout general.

### Agregar nuevas vistas al sidebar

Para agregar una nueva vista:

1. Crear el componente dentro de `features/nombre-vista`.
2. Registrar una ruta hija dentro de `app.routes.ts`, bajo el layout principal.
3. Agregar un nuevo `MenuItem` en `layout/sidebar.component.ts`.

Ejemplo:

```ts
{
  label: 'Tickets',
  icon: 'pi pi-inbox',
  routerLink: '/tickets'
}
```

El objetivo es mantener el sidebar como punto unico de navegacion interna, sin navbar superior global ni menus horizontales.

## Configuracion y Gestion de Usuarios

La vista de configuracion vive en:

```text
frontend/src/app/features/config/
```

La ruta `/config` se renderiza dentro de `LayoutComponent`, por lo que el sidebar permanece visible y solo cambia el contenido derecho. Esta pantalla mantiene la estetica glass del dashboard: blur, transparencias, bordes redondeados y tipografia del sistema.

### Estructura

Archivos principales:

```text
config.component.ts              # Vista principal de configuracion
config-menu.component.ts         # Submenu interno de configuracion
users-panel.component.ts         # Panel de Gestion de usuarios
users-panel.component.html       # Tabla y modal Crear usuario
users-panel.component.scss       # Estilos locales de tabla y modal
```

El submenu interno incluye:

- Perfil
- Cuenta
- Apariencia
- Accesibilidad
- Notificaciones
- Usuarios

### Modal Crear Usuario

El boton `Crear usuario` abre un `p-dialog` de PrimeNG dentro de la misma ruta `/config`. No se crea una ruta nueva porque es un flujo interno tipo SaaS: el usuario permanece en contexto, con sidebar y layout intactos.

Campos del formulario:

- Nombre
- Apellido
- Usuario
- Correo
- Rol
- Estado
- Contraseña
- Confirmar contraseña

El campo `Usuario` se genera automaticamente con la primera letra del nombre y el primer apellido. Por ejemplo:

```text
Nombre: Alexander
Apellido: Varela Lopez
Usuario generado: avarela
```

Validaciones actuales de frontend:

- Nombre requerido.
- Apellido requerido.
- Usuario requerido.
- Rol requerido.
- Estado requerido.
- Contraseña requerida.
- Confirmar contraseña requerida.
- Correo con formato valido cuando se ingresa.
- Contraseña y confirmacion deben coincidir.

> Estado actual: el modal solo valida UI y muestra una confirmacion visual. Todavia no llama al backend ni persiste usuarios en MongoDB.

## Backend API (Help Desk Taller APA)

## Autenticacion y Roles

Se implemento una primera base de autenticacion real para separar la experiencia de `Administrador` y `Tecnico`.

### Login real

El login del frontend llama a:

```text
POST /api/auth/login
```

Payload:

```json
{
  "username": "jzuniga",
  "password": "contrasena"
}
```

El backend valida el usuario en MongoDB con `Usuario.comparePassword()`, que compara la contrasena contra el hash PBKDF2 almacenado. La respuesta nunca incluye `passwordHash`.

Respuesta esperada:

```json
{
  "message": "Inicio de sesion exitoso",
  "user": {
    "id": "id-del-usuario",
    "username": "jzuniga",
    "name": "Jose Antonio Zuniga",
    "email": "sistemas2@almacenpajaroazul.com",
    "role": "Tecnico",
    "roleCode": "tecnico",
    "roleId": "id-del-rol"
  },
  "token": null,
  "sessionMode": "temporary-session-storage"
}
```

### Sesion temporal en frontend

`AuthService` vive en:

```text
frontend/src/app/core/services/auth.service.ts
```

Responsabilidades:

- `login(username, password)`
- `logout()`
- obtener usuario actual
- obtener rol actual
- verificar `isTecnico()`
- verificar `isAdministrador()`
- exponer estado autenticado

La sesion se guarda temporalmente en `sessionStorage` con datos minimos del usuario. No se guarda la contrasena.

> Pendiente tecnico: migrar esta sesion a JWT real con expiracion, firma, refresh token y validacion completa en middleware.

### JWT - Autenticacion Real (Implementado)

El sistema utiliza **JWT (JSON Web Tokens)** como mecanismo principal de autenticacion.

#### Flujo JWT

1. **Login**: Usuario envia credenciales a `POST /api/auth/login`
2. **Validacion Backend**: Contraseña comparada contra hash PBKDF2 en MongoDB
3. **Token Generado**: Backend retorna JWT firmado con `JWT_SECRET`
4. **Almacenamiento Frontend**: Token guardado en `sessionStorage` (no en localStorage por seguridad)
5. **Adjuncion Automatica**: Interceptor agrega `Authorization: Bearer <token>` a todas las llamadas `/api/*`
6. **Validacion Backend**: Middleware verifica JWT en cada request

#### Estructura del JWT

Payload incluye:
- `sub`: ID del usuario (para recuperar datos de BD si es necesario)
- `username`: Nombre de usuario
- `roleCode`: Codigo de rol (administrador, manager, tecnico, recepcion)
- `roleId`: ID del rol en MongoDB

Expiracion: 8 horas (configurable en `JWT_EXPIRES_IN`)

#### Seguridad

- **passwordHash nunca viaja**: Backend excluye campo `-passwordHash` en todas las respuestas
- **x-user-id fallback temporal**: Se mantiene para compatibilidad mientras se estabiliza JWT
- **401 limpia sesion**: Si token es inválido o expirado, frontend limpia sessionStorage y redirige a `/login`
- **No refresh token**: Por ahora, sesion expira en 8 horas. Implementar refresh token es trabajo futuro.

### Interceptor Autenticacion

Archivo:

```text
frontend/src/app/core/interceptors/auth-session.interceptor.ts
```

Responsabilidades:
- Agrega `Authorization: Bearer <token>` SOLO a requests `/api/*`
- No altera llamadas a assets, imágenes o URLs externas
- Captura errores 401 y limpia sesion + redirige a `/login`

### Control de Acceso - Roles y Permisos

#### Roles Soportados

- **manager**: Acceso administrativo completo. Puede ver todos los usuarios (incluyendo usuario APA).
- **administrador**: Gestiona usuarios (excepto manager/APA). Acceso a `/config`.
- **tecnico**: Solo ve sus tickets asignados. Sin acceso a gestion de usuarios.
- **recepcion**: (Futuro) Sin acceso a /config.

#### Protecciones Backend

**User Controller** (`backend/controllers/user.controller.js`):
- `POST /` (crear): Solo administrador (manager bypass automático)
- `GET /`: Filtra usuarios manager para no-managers
- `GET /:id`: Retorna 404 si es manager y requester no es manager
- `PUT /:id`: Bloquea modificacion de manager para no-managers
- `DELETE /:id`: Bloquea eliminacion logica de manager para no-managers

**Ticket Controller** (`backend/routes/ticket.routes.js`):
- `GET /`: Tecnico solo ve sus tickets asignados (filtro `tecnicoAsignado`)
- `GET /:id`: Tecnico no puede ver tickets de otros tecnicos
- `PUT /:id`: Tecnico solo puede cambiar estados permitidos (matriz `TECHNICIAN_STATUS_UPDATES`)

#### Protecciones Frontend

**Guards** (`frontend/src/app/core/guards/`):
- `authGuard`: Valida que exista token + usuario en sesion
- `roleGuard`: Valida roles permitidos segun `route.data.allowedRoles`

**Rutas Protegidas**:
- `/home`, `/tickets`, `/recepcion-equipo`: Requieren `authGuard`
- `/config`: Requiere `authGuard` + `roleGuard` con rol `administrador` (manager bypass automático)

**Sidebar Dinamico** (`frontend/src/app/layout/sidebar.component.ts`):
- Tecnico: Oculta "Recepcion de equipo", "Reportes", "Configuracion"
- Otros roles: Ven menu completo

#### Manager como Superusuario

- Puede crear usuarios manager
- Solo manager puede editar otro manager
- Solo manager puede ver lista completa de usuarios
- Acceso a `/config` garantizado (roleGuard incluye manager en administrador)

#### Administrador (SIN acceso a APA/manager)

- No ve usuario APA/manager en listados
- No puede obtener detalles de usuario APA/manager
- No puede editar usuario APA/manager
- No puede eliminar usuario APA/manager
- Acceso a `/config` para gestionar usuarios normales

#### Tecnico (SIN acceso a usuarios)

- No puede acceder a `/api/users`
- No ve `/config` en sidebar
- Si accede manualmente a `/config`, redirige a `/home`
- Solo ve tickets asignados a él
- Solo puede cambiar estado de sus propios tickets (estados permitidos)

### Permisos por rol

Administrador:

- ve todos los tickets
- ve estadisticas globales
- puede gestionar usuarios
- puede asignar tecnicos
- conserva acceso a configuracion

Tecnico:

- ve solo tickets donde `tecnicoAsignado` coincide con su usuario autenticado
- ve metricas propias en Overview
- no ve Configuracion en el sidebar
- no accede a Gestion de usuarios
- puede actualizar estados tecnicos permitidos de sus propios tickets

Estados tecnicos permitidos:

```text
en_diagnostico
diagnosticado
espera_repuesto
listo_para_reparacion
en_reparacion
reparado_servicio_finalizado
```

### Endpoints protegidos

```text
GET /api/tickets
GET /api/tickets/my-tickets
PATCH /api/tickets/:id/status
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

Para `Tecnico`, `GET /api/tickets` y `GET /api/tickets/my-tickets` filtran en backend por `tecnicoAsignado`.

`PATCH /api/tickets/:id/status` valida:

- sesion requerida
- ticket existente
- si el rol es `Tecnico`, el ticket debe estar asignado a ese usuario
- el estado solicitado debe estar dentro de la lista tecnica permitida

### Roles historicos

La base actual puede tener usuarios con `rol_id` historico aunque la coleccion `roles` este vacia. Por eso el backend incluye un fallback temporal:

```text
6a126c9296a6e0cb6e9df8a3 -> administrador
6a126c9296a6e0cb6e9df8a4 -> tecnico
```

Pendiente recomendado: ejecutar o corregir el seed de roles para que todos los usuarios apunten a documentos reales en la coleccion `roles`.

El backend esta construido con **Node.js + Express** y se conecta a una base de datos **MongoDB** mediante **Mongoose**. Se ejecuta con **nodemon** en desarrollo para recarga automatica.

### Estructura de carpetas

```text
backend/
  server.js               # Punto de entrada principal
  config/
    database.js           # Conexion a MongoDB con Mongoose
  models/
    user.model.js         # Schema y modelo de Usuario
  controllers/
    user.controller.js    # Logica de negocio para usuarios
  routes/
    user.routes.js        # Definicion de endpoints REST
```

### Arrancar el servidor

Desde la raiz del proyecto:

```bash
# Modo desarrollo con nodemon (recarga automatica)
npm run dev

# Modo produccion
npm start
```

El servidor escucha en: `http://localhost:3080`

### Variables de entorno

| Variable | Valor por defecto | Descripcion |
|---|---|---|
| `PORT` | `3080` | Puerto del servidor Express |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/appTallerAPA` | URI de conexion a MongoDB |
| `NODE_ENV` | `development` | Entorno de ejecucion |

### Endpoints de Usuarios

Base path: `/api/users`

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/users` | Obtener todos los usuarios activos |
| `GET` | `/api/users/:id` | Obtener un usuario por ID |
| `POST` | `/api/users` | Crear un nuevo usuario |
| `PUT` | `/api/users/:id` | Actualizar datos de un usuario |
| `DELETE` | `/api/users/:id` | Baja logica (soft delete) de un usuario |

### Ejemplo de uso con curl

```bash
# Listar todos los usuarios
curl http://localhost:3080/api/users

# Crear un usuario
curl -X POST http://localhost:3080/api/users \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan", "email": "juan@example.com"}'

# Obtener usuario por ID
curl http://localhost:3080/api/users/<id>

# Actualizar usuario
curl -X PUT http://localhost:3080/api/users/<id> \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Actualizado"}'

# Eliminar usuario (soft delete)
curl -X DELETE http://localhost:3080/api/users/<id>
```

### Dependencias del backend

Los modulos de Node.js estan instalados en el directorio padre (`../node_modules/`).
Las dependencias principales son: `express`, `mongoose`, `nodemon`.

### Manejo de errores

- Rutas no encontradas devuelven `404` con `{ "error": "Ruta no encontrada" }`.
- Errores internos devuelven `500` con `{ "error": "Ocurrio un error interno en el servidor" }`.
- Si MongoDB no esta disponible al iniciar, el proceso termina con codigo de salida `1`.
