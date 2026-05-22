---
title: Estado actual del proyecto
description: Resumen tecnico y funcional del avance inicial del Help Desk de Taller APA.
---

# Estado actual del proyecto

`appTallerAPA` es el sistema interno de Help Desk para Taller en Almacen Pajaro Azul. El objetivo final es centralizar tickets, incidentes, reparaciones, estados, asignaciones, SLA y tableros operativos.

## Alcance construido

Hasta este punto se completo una base inicial del frontend y la configuracion minima del backend para desarrollo.

### Frontend

El frontend vive en:

```text
/run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos/appTallerAPA/frontend
```

Estado actual:

- Angular 21 configurado.
- PrimeNG configurado con tema Aura.
- PrimeIcons importado globalmente.
- Primera pantalla visible: `Login`.
- Formulario visual con usuario, contrasena y boton de inicio de sesion.
- Estilo glass adaptado a SCSS propio.
- Fuentes declaradas como variables CSS:
  - `--font-ui`: San Francisco / SF Pro.
  - `--font-reading`: New York.
  - `--font-mono`: SF Mono.

> Nota: En Fedora las fuentes Apple no estan instaladas por defecto. El CSS ya esta preparado para usarlas cuando existan en el sistema y mientras tanto usa fallbacks seguros.

### Backend

El backend vive en:

```text
/run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos/appTallerAPA/backend
```

Estado actual:

- Estructura creada: `config`, `models`, `routes`.
- Archivo `server.js` creado pero todavia vacio.
- `nodemon` configurado para observar cambios del backend.

## Dependencias centralizadas

La raiz de dependencias compartidas es:

```text
/run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos
```

Paquetes relevantes instalados en la raiz central:

- Angular CLI.
- Angular build/compiler.
- PrimeNG.
- PrimeIcons.
- `@primeuix/themes`.
- Express.
- Mongoose.
- Nodemon.
- Vitest.
- TypeScript.

## Archivos clave

| Archivo | Proposito |
| --- | --- |
| `frontend/src/main.ts` | Punto de entrada de Angular. |
| `frontend/src/app/app.config.ts` | Configuracion global de Angular, router, animaciones y PrimeNG. |
| `frontend/src/app/app.ts` | Componente raiz que monta el login. |
| `frontend/src/app/login/login.ts` | Componente de la pantalla Login. |
| `frontend/src/app/login/login.html` | Estructura visual del formulario de login. |
| `frontend/src/app/login/login.scss` | Estilos glass y tipografia del login. |
| `frontend/src/styles.scss` | Estilos globales, PrimeIcons y variables de fuentes. |
| `nodemon.json` | Configuracion de recarga automatica para backend. |

## Verificacion actual

Comandos validados:

```bash
cd /run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos/appTallerAPA/frontend
npm run build
npm test -- --watch=false
```

Resultado esperado:

- Build Angular correcto.
- Pruebas unitarias correctas.
- Servidor de desarrollo disponible en `http://localhost:4200/`.

## Pendiente para el siguiente sprint

- Guardar cambios en Git/GitHub.
- Crear rutas reales `/login` y `/dashboard`.
- Agregar validaciones visuales al formulario.
- Crear `backend/server.js` minimo con Express.
- Crear autenticacion real.
- Conectar login con backend y MongoDB.
