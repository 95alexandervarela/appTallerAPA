import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateDiagnosticoTecnicoPayload {
  ticketId: string;
  numeroCaso: string;
  tecnicoId: string;
  fallaReportada: string;
  fallaEncontrada: string;
  causaProbable: string;
  pruebasRealizadas: string[];
  repuestoRequerido: boolean;
  repuestosSugeridos: Array<{
    descripcion: string;
    cantidad: number;
    motivo: string;
  }>;
  requiereGarantiaAutorizacion: boolean;
  observaciones: string;
  resultadoDiagnostico: string;
  estadoDiagnostico: string;
}

export interface DiagnosticoTecnicoResponse {
  message: string;
  data: {
    _id: string;
    ticketId: string;
    numeroCaso: string;
    estadoDiagnostico: string;
    resultadoDiagnostico: string;
  };
}

/**
 * Servicio del modulo de Diagnostico Tecnico.
 *
 * El diagnostico es el primer subflujo tecnico despues de asignar un ticket.
 * En fases posteriores este registro disparara transiciones de estado del ticket.
 */
@Injectable({
  providedIn: 'root',
})
export class DiagnosticoTecnicoService {
  private apiUrl = '/api/diagnosticos-tecnicos';

  constructor(private http: HttpClient) {}

  createDiagnostico(payload: CreateDiagnosticoTecnicoPayload): Observable<DiagnosticoTecnicoResponse> {
    return this.http.post<DiagnosticoTecnicoResponse>(this.apiUrl, payload);
  }
}
