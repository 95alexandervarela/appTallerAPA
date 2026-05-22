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
