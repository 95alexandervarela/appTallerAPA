# appTallerAPA

Sistema interno de Help Desk para el departamento de Taller de Almacen Pajaro Azul.

## Estado actual

El proyecto esta en fase inicial. Ya existe una base Angular para el frontend, PrimeNG esta configurado como libreria visual y la primera pantalla visible es `Login`.

El backend Node/Express todavia esta pendiente de implementacion funcional; por ahora existe la estructura base y `nodemon` esta configurado para observar `backend/server.js`.

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
