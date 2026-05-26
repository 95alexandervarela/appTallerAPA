# Seguridad del Sistema - Taller APA

Documento que describe las políticas de autenticación, autorización y protección de datos del sistema Help Desk Taller APA.

**Última actualización**: 25 de mayo de 2026 | **Commit**: 115183c (feat: connect frontend jwt session)

---

## 1. Autenticación (Identificación)

### JWT - Token Web JSON

El sistema implementa **autenticación basada en JWT** como mecanismo principal.

#### Generación de Token

**Endpoint**: `POST /api/auth/login`

**Flujo**:
1. Usuario envía `username` y `password`
2. Backend busca usuario en MongoDB por `username` (case-insensitive)
3. Contraseña validada contra hash PBKDF2 almacenado en `Usuario.passwordHash`
4. Si valida: Backend firma JWT con `JWT_SECRET`
5. JWT contiene payload mínimo y seguro (nunca incluye `passwordHash`)

**Payload JWT**:
```json
{
  "sub": "id-del-usuario",
  "username": "jzuniga",
  "roleCode": "tecnico",
  "roleId": "id-del-rol"
}
```

**Expiracion**: 8 horas (configurable en `JWT_EXPIRES_IN`)

#### Almacenamiento en Frontend

- **Ubicacion**: `sessionStorage` (no `localStorage`)
- **Clave**: `helpDeskTallerAPA.authSession`
- **Contenido**:
  ```json
  {
    "user": { /* Usuario minimo */ },
    "token": "eyJhbGc...",
    "sessionMode": "jwt"
  }
  ```
- **Duracion**: Se limpia al cerrar sesión o al cerrarse el navegador

#### Validación en Backend

**Middleware**: `backend/middleware/authContext.middleware.js` - `requireAuthContext`

**Proceso**:
1. Extrae header `Authorization: Bearer <token>`
2. Verifica firma JWT con `JWT_SECRET`
3. Si JWT inválido/expirado: Retorna `401 Unauthorized`
4. Si JWT válido: Resuelve usuario desde MongoDB usando `sub` (user ID)
5. Carga `req.authUser` con datos seguros del usuario
6. Carga `req.authUserDocument` con documento completo de Mongoose

**Fallback x-user-id**: Se mantiene temporalmente para compatibilidad. Si no existe `Authorization`, intenta leer `x-user-id`.

### Contraseñas

- **Almacenamiento**: Hash PBKDF2 (SHA-256, salt de 16 bytes)
- **Hash generado por**: `Node.js crypto` en pre-hook `userSchema.pre('save')`
- **Comparacion**: Método `Usuario.comparePassword(password)` en modelo
- **Nunca en respuesta**: Todas las respuestas excluyen `passwordHash` con `-passwordHash`

---

## 2. Autorización (Control de Acceso)

### Matriz de Roles y Permisos

#### Manager
**Proposito**: Superusuario administrativo del sistema.

**Permisos**:
- ✅ Ver todos los usuarios (incluyendo otros managers)
- ✅ Crear usuarios (cualquier rol, incluyendo managers)
- ✅ Editar usuarios (cualquier rol)
- ✅ Eliminar usuarios lógicamente (soft delete)
- ✅ Acceder a `/api/config` y `/config`
- ✅ Ver todos los tickets
- ✅ Acceso administrativo completo
- ✅ Bypass automático en rutas que requieren `administrador`

**Restricciones**:
- ❌ No puede ser creado por administrador (solo por manager)
- ❌ No puede ser editado por administrador
- ❌ No puede ser eliminado por administrador

#### Administrador
**Proposito**: Gestor de usuarios y configuración (sin acceso a manager).

**Permisos**:
- ✅ Ver usuarios normales (no managers)
- ✅ Crear usuarios normales
- ✅ Editar usuarios normales
- ✅ Eliminar usuarios normales
- ✅ Acceder a `/api/config` y `/config`
- ✅ Ver todos los tickets
- ✅ Asignar técnicos a tickets

**Restricciones**:
- ❌ No ve usuarios manager
- ❌ No puede editar usuario manager
- ❌ No puede eliminar usuario manager
- ❌ No puede crear usuario manager (solo manager puede)
- ❌ Si intenta acceder a manager: Obtiene `404 Usuario no encontrado`

#### Técnico
**Proposito**: Reparador de equipos, operador de tickets asignados.

**Permisos**:
- ✅ Ver overview con estadísticas propias
- ✅ Ver solo sus tickets asignados
- ✅ Actualizar estado de sus tickets (estados permitidos)
- ✅ Ver detalles de sus tickets

**Restricciones**:
- ❌ No puede acceder a `/api/users`
- ❌ No ve `/config` en sidebar
- ❌ Si accede manualmente a `/config`: Redirige a `/home`
- ❌ No ve tickets de otros técnicos
- ❌ Si intenta acceder a ticket ajeno: `403 Forbidden`
- ❌ Solo puede cambiar estados en matriz permitida:
  - `en_diagnostico`
  - `diagnosticado`
  - `espera_repuesto`
  - `listo_para_reparacion`
  - `en_reparacion`
  - `reparado_servicio_finalizado`

#### Recepción
**Proposito**: Entrada de equipos al sistema.

**Permisos**:
- ✅ Crear recepción de equipos
- ✅ Ver sus propias recepciones

**Restricciones**:
- ❌ No acceso a configuración
- ❌ No acceso a usuarios
- ❌ No acceso a tickets

### Implementación de Autorización

#### Backend - Middleware de Autorización

**Archivo**: `backend/middleware/authContext.middleware.js`

**Función**: `requireRole(allowedRoleCodes)`

```javascript
requireRole(['administrador']) // Solo administrador
requireRole(['tecnico'])        // Solo técnico
requireRole(['manager'])        // Solo manager
```

**Manager Bypass**: Si `allowedRoleCodes` incluye `'administrador'` y el usuario es `manager`, se permite acceso automáticamente.

**Ejemplo en rutas**:
```javascript
router.post('/', 
  requireAuthContext,
  requireRole(['administrador']),
  userController.createUser
);
```

#### Frontend - Guards de Rutas

**authGuard** (`frontend/src/app/core/guards/auth.guard.ts`):
- Valida que exista usuario + token en `sessionStorage`
- Si no: Redirige a `/login`

**roleGuard** (`frontend/src/app/core/guards/role.guard.ts`):
- Valida rol en `route.data.allowedRoles`
- Manager bypass automático para rutas de `administrador`
- Si no tiene permiso: Redirige a `/home`

**Ejemplo en rutas**:
```typescript
{
  path: 'config',
  component: LayoutComponent,
  canActivate: [authGuard, roleGuard],
  data: { allowedRoles: ['administrador'] },
  children: [...]
}
```

### Protección de Endpoints Críticos

#### Usuarios (`/api/users`)

| Método | Proteccion | Comportamiento |
|--------|-----------|-----------------|
| `POST /` | Administrador | Crea usuario. Manager puede crear managers. |
| `GET /` | Administrador | Lista usuarios. Administrador no ve managers. |
| `GET /:id` | Administrador | Retorna 404 si es manager y no es manager. |
| `PUT /:id` | Administrador | Bloquea edicion de managers (solo manager puede). |
| `DELETE /:id` | Administrador | Bloquea eliminacion de managers (solo manager puede). |

#### Tickets (`/api/tickets`)

| Método | Proteccion | Comportamiento |
|--------|-----------|-----------------|
| `POST /` | Autenticado | Crea ticket. Técnico ve solo los suyos. |
| `GET /` | Autenticado | Lista tickets. Técnico: filtro por `tecnicoAsignado`. |
| `GET /:id` | Autenticado | Técnico: 403 si no es el asignado. |
| `PUT /:id` | Autenticado | Técnico: Solo estados permitidos. |
| `DELETE /:id` | Autenticado | (Futuro) Eliminación lógica de tickets. |

---

## 3. Protección de Datos Sensibles

### Datos Nunca Expuestos

Los siguientes campos **NUNCA** se incluyen en respuestas HTTP:
- `passwordHash` (excluido con `-passwordHash` en queries)
- Salt de contraseña (no visible, generado internamente)
- JWT_SECRET (solo en backend)
- Credenciales de BD (nunca en respuesta)

### Datos en Sesion Frontend

**sessionStorage** incluye:
- ID del usuario
- Username
- Nombre completo
- Email
- Rol (nombre y código)
- Token JWT

**sessionStorage NO incluye**:
- Contraseña
- Hash de contraseña
- JWT_SECRET

---

## 4. Manejo de Sesiones

### Cierre de Sesión

**Logout Local** (`frontend/src/app/core/services/auth.service.ts`):
```typescript
logout(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  this.currentUserSubject.next(null);
}
```

**Limpieza en 401** (Interceptor automático):
- Backend retorna `401 Unauthorized`
- Frontend limpia sesión automáticamente
- Redirige a `/login`

### Expiración de Token

- JWT expira en **8 horas**
- Si token expirado: Verificación en middleware falla
- Backend retorna `401`
- Frontend limpia sesión

**Nota**: No hay implementado refresh token aún. Trabajo futuro.

---

## 5. Seguridad del Interceptor HTTP

**Archivo**: `frontend/src/app/core/interceptors/auth-session.interceptor.ts`

### Comportamiento

**Adjunta Authorization SOLO a**:
- Peticiones que comienzan con `/api`
- Peticiones a `localhost:3080/api`

**NO adjunta Authorization a**:
- Llamadas a assets (CSS, JS, images)
- Llamadas externas
- `POST /api/auth/login` (por protocolo)

### Manejo de Errores 401

```typescript
if (error.status === 401 && isApiRequest) {
  authService.logout();  // Limpia sesion
  router.navigateByUrl('/login');  // Redirige
}
```

---

## 6. CORS (Control de Origen)

**Archivo**: `backend/server.js`

**Origenes Permitidos**:
- `http://localhost:4200`
- `http://127.0.0.1:4200`
- `http://[::1]:4200` (IPv6 loopback)
- `http://localhost:3080`
- `https://hvvph486-4200.use2.devtunnels.ms`
- IPs privadas (192.168.x.x, 10.x.x.x, 172.16-31.x.x)

**Metodo**: Whitelist con Set y regex

---

## 7. Validaciones de Entrada

### Login
- Username: No vacío, trim, lowercase
- Password: No vacío

### Creación de Usuario
- Username: No vacío, único, lowercase
- Email: Formato válido, único
- Nombre: No vacío
- Rol: ID válido en roles
- Contraseña: No vacía
- Manager: Solo manager puede crear

### Actualización de Usuario
- Duplicados validados en cada campo
- Manager: No puede ser modificado por administrador
- Rol manager: No puede ser asignado por administrador

---

## 8. Checklist de Seguridad

✅ JWT implementado y funcionando
✅ passwordHash nunca en respuesta
✅ 401 limpia sesión automáticamente
✅ Manager protegido de modificación por administrador
✅ Técnico no accede a `/api/users`
✅ Técnico solo ve sus tickets
✅ Interceptor solo agrega Bearer a `/api/*`
✅ CORS configurado con whitelist
✅ Roles validados en frontend y backend
✅ Bypass manager para rutas administrador funciona
✅ Fallback x-user-id mantiene compatibilidad
✅ sessionStorage se limpia al logout
✅ sessionStorage se limpia en 401
✅ Sidebar filtra items por rol

---

## 9. Trabajo Futuro

- [ ] Implementar refresh token
- [ ] Agregar expiración corta en cookies httpOnly
- [ ] Rate limiting en endpoint login
- [ ] Auditoría de cambios de rol
- [ ] 2FA (autenticación de dos factores)
- [ ] Rotación de JWT_SECRET
- [ ] Password reset seguro
- [ ] Logs de seguridad

---

## 10. Variables de Entorno Requeridas

```bash
# Backend
JWT_SECRET=<clave-secreta-fuerte>
JWT_EXPIRES_IN=8h
PORT=3080

# Frontend
# No requiere variables especiales
```

---

## Contacto y Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor reportarla a: [email de seguridad]

**No publicar vulnerabilidades públicamente hasta que sean parcheadas.**
