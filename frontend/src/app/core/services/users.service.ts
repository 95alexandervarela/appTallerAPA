import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateUserPayload {
  username: string;
  email: string;
  nombre_completo: string;
  password: string;
  rol_id: string;
  activo?: boolean;
}

export interface UserResponse {
  message: string;
  user: {
    _id: string;
    username: string;
    email: string;
    nombre_completo: string;
    rol_id: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
  };
}

/**
 * Servicio para la gestión de usuarios.
 *
 * @remarks
 * Proporciona métodos para comunicarse con el API de usuarios en el backend.
 * Configura la URL base del API y maneja las solicitudes HTTP.
 */
@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = 'http://localhost:3080/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Crea un nuevo usuario en el sistema.
   *
   * @param payload Datos del usuario a crear
   * @returns Observable con la respuesta del servidor
   */
  createUser(payload: CreateUserPayload): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, payload);
  }

  /**
   * Obtiene la lista de usuarios activos.
   *
   * @returns Observable con la lista de usuarios
   */
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  /**
   * Obtiene un usuario específico por su ID.
   *
   * @param id ID del usuario
   * @returns Observable con los datos del usuario
   */
  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza un usuario existente.
   *
   * @param id ID del usuario
   * @param payload Datos actualizados del usuario
   * @returns Observable con la respuesta del servidor
   */
  updateUser(id: string, payload: Partial<CreateUserPayload>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Elimina definitivamente un usuario.
   *
   * @param id ID del usuario
   * @returns Observable con la respuesta del servidor
   */
  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
