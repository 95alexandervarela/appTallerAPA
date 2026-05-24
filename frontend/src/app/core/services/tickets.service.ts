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

export interface TicketResponse {
  message: string;
  ticket: {
    _id: string;
    numeroTicket: string;
    nombreCliente: string;
    tipoEquipo: string;
    estadoTicket: string;
    prioridad: string;
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
}
