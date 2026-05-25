import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type AuthRoleCode = 'administrador' | 'tecnico' | 'recepcion' | 'supervisor' | 'desconocido';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  roleCode: AuthRoleCode;
  roleId: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  token: string | null;
  sessionMode: string;
}

interface StoredAuthSession {
  user: AuthUser;
  token: string | null;
  sessionMode: string;
}

const AUTH_SESSION_KEY = 'helpDeskTallerAPA.authSession';

/**
 * Servicio centralizado de autenticacion del frontend.
 *
 * @remarks
 * Conecta el login con `/api/auth/login`, guarda solo datos minimos del usuario
 * en `sessionStorage` y expone helpers de rol para evitar duplicar permisos en
 * componentes. No guarda contrasenas.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(
    this.readStoredUser(),
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Valida credenciales contra backend y abre una sesion temporal controlada.
   *
   * @param username Usuario escrito en el login.
   * @param password Contrasena escrita en el login.
   * @returns Respuesta con usuario minimo autenticado.
   */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, {
        username: username.trim().toLowerCase(),
        password,
      })
      .pipe(
        tap((response) => {
          this.storeSession(response);
        }),
      );
  }

  /**
   * Cierra la sesion local temporal.
   */
  logout(): void {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string {
    return this.currentUserSubject.value?.id ?? '';
  }

  getCurrentRole(): AuthRoleCode {
    return this.currentUserSubject.value?.roleCode ?? 'desconocido';
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  isTecnico(): boolean {
    return this.getCurrentRole() === 'tecnico';
  }

  isAdministrador(): boolean {
    return this.getCurrentRole() === 'administrador';
  }

  private storeSession(response: LoginResponse): void {
    const session: StoredAuthSession = {
      user: response.user,
      token: response.token,
      sessionMode: response.sessionMode,
    };

    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    this.currentUserSubject.next(response.user);
  }

  private readStoredUser(): AuthUser | null {
    const rawSession = sessionStorage.getItem(AUTH_SESSION_KEY);

    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession) as StoredAuthSession;
      return session.user ?? null;
    } catch (error) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
  }
}
