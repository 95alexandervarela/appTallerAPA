import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateValidacionGarantiaPayload {
  ticketId: string;
  numeroCaso: string;
  tipoValidacion: string;
  responsableId?: string;
  clienteInformado: boolean;
  costoTotalReparacion: number;
  requiereRepuesto: boolean;
  repuestoRequerido: string;
  decisionGarantia: string;
  decisionCliente: string;
  motivoDecision: string;
  evidenciaAutorizacion: string;
  estadoValidacion: string;
}

export interface ValidacionGarantiaResponse {
  message: string;
  data: {
    _id: string;
    ticketId: string;
    numeroCaso: string;
    estadoValidacion: string;
  };
}

/**
 * Servicio del modulo Garantia / Autorizacion.
 *
 * Este modulo decide si el ticket queda pendiente de aprobacion, continua
 * autorizado o debe esperar informacion del cliente para pasos futuros.
 */
@Injectable({
  providedIn: 'root',
})
export class ValidacionGarantiaService {
  private apiUrl = '/api/validaciones-garantia';

  constructor(private http: HttpClient) {}

  createValidacion(payload: CreateValidacionGarantiaPayload): Observable<ValidacionGarantiaResponse> {
    return this.http.post<ValidacionGarantiaResponse>(this.apiUrl, payload);
  }
}
