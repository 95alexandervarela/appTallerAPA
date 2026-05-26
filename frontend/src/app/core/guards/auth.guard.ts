import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protege rutas internas que requieren una sesion autenticada.
 *
 * @remarks
 * Si no hay usuario/token JWT en la sesion, redirige a `/login` sin tocar el
 * layout ni los componentes visuales existentes.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
