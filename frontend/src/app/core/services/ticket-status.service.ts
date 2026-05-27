import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TicketStatusConfig {
  _id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  isFinal: boolean;
  isActive: boolean;
  order: number;
  isLegacy?: boolean;
}

export interface TicketStatusPayload {
  name: string;
  code?: string;
  description?: string;
  color: string;
  isFinal: boolean;
  isActive: boolean;
  order: number;
}

export interface TicketStatusResponse {
  message: string;
  status: TicketStatusConfig;
}

/**
 * Servicio central para estados configurables de tickets.
 *
 * @remarks
 * El backend mantiene cache y fallback legacy; el frontend solo consume la
 * fuente activa para dropdowns y el panel administrativo de Configuracion.
 */
@Injectable({
  providedIn: 'root',
})
export class TicketStatusService {
  private readonly apiUrl = '/api/config/statuses';

  constructor(private http: HttpClient) {}

  getStatuses(): Observable<TicketStatusConfig[]> {
    return this.http.get<TicketStatusConfig[]>(`${this.apiUrl}/active`);
  }

  getActiveStatuses(): Observable<TicketStatusConfig[]> {
    return this.http.get<TicketStatusConfig[]>(`${this.apiUrl}/active`);
  }

  createStatus(payload: TicketStatusPayload): Observable<TicketStatusResponse> {
    return this.http.post<TicketStatusResponse>(this.apiUrl, payload);
  }

  updateStatus(id: string, payload: TicketStatusPayload): Observable<TicketStatusResponse> {
    return this.http.put<TicketStatusResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteStatus(id: string): Observable<TicketStatusResponse> {
    return this.http.delete<TicketStatusResponse>(`${this.apiUrl}/${id}`);
  }
}
