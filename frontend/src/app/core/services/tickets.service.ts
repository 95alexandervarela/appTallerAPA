import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CreateTicketPayload {
  numeroTicket: string;
  recepcionEquipoId: string;
  creadoPor: string;
  prioridad: string;
  estadoTicket: string;
}

export interface TechnicianOption {
  _id: string;
  username: string;
  email: string;
  nombre_completo: string;
  rol_id: string;
  activo: boolean;
}

export interface AssignTechnicianPayload {
  tecnicoAsignado: string;
  observacionesAsignacion?: string;
}

export interface UpdateTicketStatusPayload {
  estadoTicket: string;
}

export interface TicketCommentUser {
  _id: string;
  username: string;
  nombre_completo?: string;
}

export interface TicketComment {
  _id: string;
  ticketId: string;
  userId: TicketCommentUser | string;
  message: string;
  createdAt: string;
  activo: boolean;
}

export interface TicketCommentResponse {
  message: string;
  comment: TicketComment;
}

export interface TicketResponse {
  message: string;
  ticket: {
    _id: string;
    numeroTicket: string;
    nombreCliente: string;
    telefonoCliente?: string;
    tipoEquipo: string;
    marcaEquipo?: string;
    modeloEquipo?: string;
    serieEquipo?: string;
    fallaReportada?: string;
    condicionFisica?: string;
    accesoriosEntregados?: string[];
    tecnicoAsignado?: TechnicianOption | string | null;
    estadoTicket: string;
    prioridad: string;
    fechaCreacion?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  private apiUrl = '/api/tickets';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createTicket(payload: CreateTicketPayload): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(this.apiUrl, payload);
  }

  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  /**
   * Obtiene tickets respetando el rol autenticado.
   *
   * @remarks
   * Tecnico consume `/my-tickets` para que el filtrado ocurra en backend.
   * Administrador conserva la vista global mediante `/api/tickets`.
   */
  getTicketsForCurrentUser(): Observable<any[]> {
    return this.authService.isTecnico() ? this.getMyTickets() : this.getTickets();
  }

  getMyTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-tickets`);
  }

  getTechnicians(): Observable<TechnicianOption[]> {
    return this.http.get<TechnicianOption[]>(`${this.apiUrl}/tecnicos-disponibles`);
  }

  assignTechnician(id: string, payload: AssignTechnicianPayload): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(`${this.apiUrl}/${id}/asignar-tecnico`, payload);
  }

  updateTicketStatus(id: string, payload: UpdateTicketStatusPayload): Observable<TicketResponse> {
    return this.http.patch<TicketResponse>(`${this.apiUrl}/${id}/status`, payload);
  }

  getTicketComments(id: string): Observable<TicketComment[]> {
    return this.http.get<TicketComment[]>(`${this.apiUrl}/${id}/comments`);
  }

  createTicketComment(id: string, message: string): Observable<TicketCommentResponse> {
    return this.http.post<TicketCommentResponse>(`${this.apiUrl}/${id}/comments`, { message });
  }
}
