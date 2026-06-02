import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardStatusCount {
  estado: string;
  label: string;
  color: string;
  isFinal: boolean;
  count: number;
}

export interface DashboardRecentActivity {
  ticket: string;
  ticketId: string;
  accion: string;
  usuario: string;
  fecha: string;
  fromStatus: string;
  fromStatusLabel: string;
  toStatus: string;
  toStatusLabel: string;
  color: string;
}

export interface DashboardOverview {
  totalTickets: number;
  ticketsPorEstado: DashboardStatusCount[];
  misTickets: number;
  urgentes: number;
  cerrados: number;
  recientes: DashboardRecentActivity[];
  scope: 'global' | 'assigned';
  generatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${this.apiUrl}/overview`);
  }
}
