import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateRecepcionEquipoPayload {
  numeroCaso: string;
  origenEquipo: string;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente?: string;
  sucursalOrigen?: string;
  tipoEquipo: string;
  marcaEquipo?: string;
  modeloEquipo?: string;
  serieEquipo?: string;
  fallaReportada: string;
  condicionFisica: string;
  accesoriosEntregados: string[];
  datosCompletos: boolean;
  esCasoEspecial: boolean;
  ingresoAutorizado: boolean;
  referenciaSap?: string;
  comprobanteEntregado: boolean;
  equipoEtiquetado: boolean;
  estadoRecepcion: string;
  recibidoPor: string;
}

export interface RecepcionEquipoResponse {
  message: string;
  recepcion: {
    _id: string;
    numeroCaso: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class RecepcionEquipoService {
  private apiUrl = 'http://localhost:3080/api/recepciones-equipo';

  constructor(private http: HttpClient) {}

  createRecepcion(payload: CreateRecepcionEquipoPayload): Observable<RecepcionEquipoResponse> {
    return this.http.post<RecepcionEquipoResponse>(this.apiUrl, payload);
  }
}
