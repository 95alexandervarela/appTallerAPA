import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Adjunta Authorization Bearer a llamadas API usando el JWT de AuthService.
 *
 * @remarks
 * El backend conserva `x-user-id` como fallback temporal, pero el frontend usa
 * JWT como flujo principal. Ante 401 limpia sesion y vuelve a `/login`.
 */
export const authSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const isApiRequest = req.url.startsWith('/api') || req.url.includes('localhost:3080/api');

  const authReq =
    token && isApiRequest && !req.url.includes('/api/auth/login')
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApiRequest && !req.url.includes('/api/auth/login')) {
        authService.logout();
        router.navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};
