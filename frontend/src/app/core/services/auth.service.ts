import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type AuthRoleCode =
  | 'administrador'
  | 'manager'
  | 'tecnico'
  | 'recepcion'
  | 'supervisor'
  | 'desconocido';

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
 * Conecta el login con `/api/auth/login`, guarda el token JWT entregado por
 * backend y centraliza la sesion en `sessionStorage`. No guarda contrasenas.
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
   * Valida credenciales contra backend y abre una sesion JWT controlada.
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
   * Cierra la sesion local JWT.
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

  getToken(): string {
    return this.readStoredSession()?.token ?? '';
  }

  getCurrentRole(): AuthRoleCode {
    return this.currentUserSubject.value?.roleCode ?? 'desconocido';
  }

  getRoleCode(): AuthRoleCode {
    return this.getCurrentRole();
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!this.getToken();
  }

  isTecnico(): boolean {
    return this.getCurrentRole() === 'tecnico';
  }

  isTechnician(): boolean {
    return this.isTecnico();
  }

  isAdministrador(): boolean {
    return this.getCurrentRole() === 'administrador' || this.getCurrentRole() === 'manager';
  }

  isAdmin(): boolean {
    return this.isAdministrador();
  }

  isManager(): boolean {
    return this.getCurrentRole() === 'manager';
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

  private readStoredSession(): StoredAuthSession | null {
    const rawSession = sessionStorage.getItem(AUTH_SESSION_KEY);

    if (!rawSession) return null;

    try {
      return JSON.parse(rawSession) as StoredAuthSession;
    } catch (error) {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
  }

  private readStoredUser(): AuthUser | null {
    return this.readStoredSession()?.user ?? null;
  }
}
