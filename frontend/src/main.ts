import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Inicializa la aplicacion Angular usando el componente raiz y la configuracion global.
 *
 * @remarks
 * Este punto de entrada mantiene el arranque separado de la configuracion para que
 * servicios globales como router, PrimeNG y animaciones queden centralizados.
 */
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
