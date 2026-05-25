import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authSessionInterceptor } from './core/interceptors/auth-session.interceptor';

/**
 * Configuracion global del frontend Angular.
 *
 * @remarks
 * Registra el router, las animaciones asincronas, HttpClient y PrimeNG con el tema Aura.
 * Este archivo es el lugar correcto para proveedores globales de la aplicacion.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authSessionInterceptor])),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
  ],
};
