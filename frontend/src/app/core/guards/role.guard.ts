import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthRoleCode, AuthService } from '../services/auth.service';

/**
 * Valida roles permitidos usando `route.data.allowedRoles`.
 *
 * @remarks
 * Bloquea accesos manuales como `/config` para perfiles Tecnico y los devuelve
 * a una pantalla permitida sin cambiar la estructura de rutas existente.
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['allowedRoles'] ?? []) as AuthRoleCode[];

  if (!allowedRoles.length || allowedRoles.includes(authService.getCurrentRole())) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
