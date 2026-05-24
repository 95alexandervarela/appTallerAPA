import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

interface SelectOption {
  label: string;
  value: string;
}

interface RecepcionEquipoForm {
  numeroCaso: string;
  origenEquipo: string;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string;
  sucursalOrigen: string;
  tipoEquipo: string;
  marcaEquipo: string;
  modeloEquipo: string;
  serieEquipo: string;
  fallaReportada: string;
  condicionFisica: string;
  accesoriosEntregados: string;
  referenciaSap: string;
  datosCompletos: boolean;
  esCasoEspecial: boolean;
  ingresoAutorizado: boolean;
  comprobanteEntregado: boolean;
  equipoEtiquetado: boolean;
  estadoRecepcion: string;
}

/**
 * Formulario visual para registrar la recepcion inicial de equipos.
 *
 * @remarks
 * Mantiene nombres de variables amigables y alineados con el esquema
 * `RecepcionEquipo` del backend.
 */
@Component({
  selector: 'app-recepcion-equipo',
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule],
  templateUrl: './recepcion-equipo.component.html',
  styleUrl: './recepcion-equipo.component.scss'
})
export class RecepcionEquipoComponent {
  protected readonly origenOptions: SelectOption[] = [
    { label: 'Cliente final', value: 'cliente_final' },
    { label: 'Sucursal', value: 'sucursal' },
    { label: 'Ventas', value: 'ventas' },
    { label: 'Garantia', value: 'garantia' },
    { label: 'Traslado interno', value: 'traslado_interno' },
    { label: 'Area APA', value: 'area_apa' },
    { label: 'Otro', value: 'otro' }
  ];

  protected readonly estadoOptions: SelectOption[] = [
    { label: 'Registrado', value: 'registrado' },
    { label: 'En diagnostico', value: 'en_diagnostico' },
    { label: 'Equipo no ingresado', value: 'equipo_no_ingresado' }
  ];

  protected form: RecepcionEquipoForm = {
    numeroCaso: '',
    origenEquipo: '',
    nombreCliente: '',
    telefonoCliente: '',
    correoCliente: '',
    sucursalOrigen: '',
    tipoEquipo: '',
    marcaEquipo: '',
    modeloEquipo: '',
    serieEquipo: '',
    fallaReportada: '',
    condicionFisica: '',
    accesoriosEntregados: '',
    referenciaSap: '',
    datosCompletos: false,
    esCasoEspecial: false,
    ingresoAutorizado: true,
    comprobanteEntregado: false,
    equipoEtiquetado: false,
    estadoRecepcion: 'registrado'
  };
}
