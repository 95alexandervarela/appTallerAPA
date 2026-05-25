import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  createTicket(payload: CreateTicketPayload): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(this.apiUrl, payload);
  }

  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getTechnicians(): Observable<TechnicianOption[]> {
    return this.http.get<TechnicianOption[]>(`${this.apiUrl}/tecnicos-disponibles`);
  }

  assignTechnician(id: string, payload: AssignTechnicianPayload): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(`${this.apiUrl}/${id}/asignar-tecnico`, payload);
  }
}
