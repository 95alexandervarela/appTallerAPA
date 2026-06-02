# appTallerAPA

Sistema interno de Help Desk para el departamento de Taller de Almacen Pajaro Azul.

## Estado actual

El proyecto tiene frontend Angular con PrimeNG y backend Node/Express conectado a MongoDB. El login valida credenciales reales y emite JWT para proteger las rutas internas.

## Estructura principal

```text
appTallerAPA/
  backend/
    config/
    models/
    routes/
    server.js
  frontend/
    src/app/
      login/
        login.ts
        login.html
        login.scss
      app.ts
      app.html
      app.config.ts
      app.routes.ts
  docs/
    estado-actual.md
  nodemon.json
  package.json
```

## Dependencias centralizadas

Las dependencias comunes se administran desde:

```text
/run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos
```

El frontend usa scripts que apuntan al Angular CLI central:

```bash
cd /run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos/appTallerAPA/frontend
npm start
```

## Arranque despues de clonar

En desarrollo local, el backend crea o normaliza automaticamente el usuario master:

```text
Usuario: sistemas
Clave: Sistemas*2026
Rol: Manager
```

Este bootstrap solo corre fuera de produccion y evita que un clon nuevo quede bloqueado por una base MongoDB vacia.

Para levantar backend:

```bash
cd /run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos/appTallerAPA
npm start
```

Para levantar frontend:

```bash
cd /run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos/appTallerAPA/frontend
ng serve
```

Si quieres forzar manualmente la normalizacion del usuario:

```bash
npm run seed:sistemas
```

Variables disponibles en `.env.example`:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/appTallerAPA
JWT_SECRET=change_this_secret_in_production
AUTO_BOOTSTRAP_SYSTEM_USER=true
SISTEMAS_BOOTSTRAP_PASSWORD=Sistemas*2026
```

## Comandos verificados

```bash
cd /run/media/alexander@PAJAROAZUL.COM/Disk/Proyectos/appTallerAPA/frontend
npm run build
npm test -- --watch=false
```

## Documentacion

La documentacion tecnica del avance esta en:

```text
docs/estado-actual.md
```

Los componentes Angular principales incluyen comentarios TSDoc compatibles con herramientas como Mintlify Doc Writer.
