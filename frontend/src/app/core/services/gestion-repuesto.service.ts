import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateGestionRepuestoPayload {
  ticketId: string;
  numeroCaso: string;
  tecnicoSolicitanteId: string;
  descripcionRepuesto: string;
  tipoRepuesto: string;
  origenRepuesto: string;
  compraExterna: boolean;
  cantidad: number;
  motivoSolicitud: string;
  proveedor: string;
  disponibleApa: boolean;
  cantidadRecibida: number;
  repuestoValidado: boolean;
  entregadoTecnico: boolean;
  tecnicoRecibeId?: string;
  diferencias: string;
  estadoRepuesto: string;
}

export interface GestionRepuestoResponse {
  message: string;
  data: {
    _id: string;
    ticketId: string;
    numeroCaso: string;
    estadoRepuesto: string;
  };
}

/**
 * Servicio del modulo Repuestos.
 *
 * Cada evento de repuesto dispara una transicion centralizada del ticket:
 * solicitud, disponibilidad y entrega al tecnico.
 */
@Injectable({
  providedIn: 'root',
})
export class GestionRepuestoService {
  private apiUrl = '/api/gestiones-repuesto';

  constructor(private http: HttpClient) {}

  createGestion(payload: CreateGestionRepuestoPayload): Observable<GestionRepuestoResponse> {
    return this.http.post<GestionRepuestoResponse>(this.apiUrl, payload);
  }
}
