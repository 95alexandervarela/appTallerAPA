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
  const currentRole = authService.getCurrentRole();
  const managerCanUseAdminRoutes = currentRole === 'manager' && allowedRoles.includes('administrador');

  if (!allowedRoles.length || allowedRoles.includes(currentRole) || managerCanUseAdminRoutes) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
