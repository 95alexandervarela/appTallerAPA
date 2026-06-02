import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TicketNotification {
  _id: string;
  sequence: number;
  type: 'ticket_assigned';
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  ticketId?: {
    _id: string;
    numeroTicket: string;
    estadoTicket: string;
    prioridad: string;
  };
  actorUserId?: {
    _id: string;
    username: string;
    nombre_completo?: string;
  };
}

export interface UnreadNotificationsResponse {
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly apiUrl = '/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(limit = 10): Observable<TicketNotification[]> {
    return this.http.get<TicketNotification[]>(`${this.apiUrl}?limit=${limit}`);
  }

  getUnreadCount(): Observable<UnreadNotificationsResponse> {
    return this.http.get<UnreadNotificationsResponse>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<TicketNotification> {
    return this.http.patch<TicketNotification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.apiUrl}/read-all`, {});
  }
}
