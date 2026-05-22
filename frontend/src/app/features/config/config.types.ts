/**
 * Opcion visible en el submenu interno de configuracion.
 *
 * @remarks
 * Permite extender la pantalla agregando nuevas secciones sin tocar el layout
 * principal ni el sidebar global.
 */
export interface ConfigOption {
  key: string;
  label: string;
  icon: string;
}
