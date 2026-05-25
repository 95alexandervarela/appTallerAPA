import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Adjunta el usuario autenticado a llamadas API mientras no exista JWT.
 *
 * @remarks
 * Es un mecanismo temporal: backend valida el usuario recibido y su rol antes
 * de filtrar tickets o permitir gestion de usuarios. Debe migrarse a JWT real.
 */
export const authSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const currentUser = authService.getCurrentUser();

  if (!currentUser || req.url.includes('/api/auth/login')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.roleCode,
      },
    }),
  );
};
