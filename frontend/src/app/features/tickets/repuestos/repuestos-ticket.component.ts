import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  CreateGestionRepuestoPayload,
  GestionRepuestoService,
} from '../../../core/services/gestion-repuesto.service';

export interface RepuestosTicketContext {
  id: string;
  numeroCaso: string;
  cliente: string;
  equipo: string;
  tecnicoAsignadoId: string;
  tecnicoAsignadoNombre: string;
  estado: string;
  estadoClassName?: string;
}

interface SelectOption {
  label: string;
  value: string;
}

interface RepuestoForm {
  evento: 'solicitar' | 'recibir' | 'entregar';
  tipoRepuesto: string;
  descripcionRepuesto: string;
  origenRepuesto: string;
  cantidad: number;
  proveedor: string;
  motivoSolicitud: string;
  cantidadRecibida: number;
  diferencias: string;
}

/**
 * Modulo de Repuestos dentro del flujo del ticket.
 *
 * No cambia estados manualmente: registra eventos operativos y el backend
 * actualiza el ticket a espera_repuesto, repuesto_disponible o listo_para_reparacion.
 */
@Component({
  selector: 'app-repuestos-ticket',
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './repuestos-ticket.component.html',
  styleUrl: './repuestos-ticket.component.scss',
})
export class RepuestosTicketComponent {
  @Input() ticket: RepuestosTicketContext | null = null;
  @Input() usuarioTemporalId = '';

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected submitted = false;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected readonly eventoOptions: SelectOption[] = [
    { label: 'Solicitar repuesto', value: 'solicitar' },
    { label: 'Registrar llegada', value: 'recibir' },
    { label: 'Entregar al tecnico', value: 'entregar' },
  ];

  protected readonly origenOptions: SelectOption[] = [
    { label: 'Stock APA', value: 'stock' },
    { label: 'Compra externa', value: 'compra_externa' },
    { label: 'APA / proveedor', value: 'apa' },
    { label: 'Otro', value: 'otro' },
  ];

  protected form: RepuestoForm = this.createEmptyForm();

  constructor(private gestionRepuestoService: GestionRepuestoService) {}

  protected saveRepuesto(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.ticket) {
      this.errorMessage = 'Selecciona un ticket antes de gestionar repuestos.';
      return;
    }

    if (!this.isFormValid()) {
      this.errorMessage = 'Completa los datos requeridos del repuesto.';
      return;
    }

    const tecnicoId = this.ticket.tecnicoAsignadoId || this.usuarioTemporalId;

    if (!tecnicoId) {
      this.errorMessage = 'El ticket necesita un tecnico para gestionar repuestos.';
      return;
    }

    this.isSaving = true;

    this.gestionRepuestoService
      .createGestion(this.buildPayload(tecnicoId))
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Evento de repuesto registrado con exito.';
          this.form = this.createEmptyForm();
          this.submitted = false;
          this.saved.emit();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.error || error.message || 'No se pudo registrar el repuesto.';
        },
      });
  }

  protected cancelRepuesto(): void {
    this.form = this.createEmptyForm();
    this.submitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.cancelled.emit();
  }

  protected isFieldInvalid(field: keyof RepuestoForm): boolean {
    if (field === 'cantidadRecibida' || field === 'diferencias') return false;
    return this.submitted && !String(this.form[field]).trim();
  }

  private buildPayload(tecnicoId: string): CreateGestionRepuestoPayload {
    const estadoRepuesto = this.getEstadoRepuesto();
    const cantidad = Number(this.form.cantidad) || 1;
    const cantidadRecibida = this.form.evento === 'recibir' || this.form.evento === 'entregar'
      ? Number(this.form.cantidadRecibida) || cantidad
      : 0;

    return {
      ticketId: this.ticket?.id || '',
      numeroCaso: this.ticket?.numeroCaso || '',
      tecnicoSolicitanteId: tecnicoId,
      descripcionRepuesto: this.form.descripcionRepuesto.trim(),
      tipoRepuesto: this.form.tipoRepuesto.trim(),
      origenRepuesto: this.form.origenRepuesto,
      compraExterna: this.form.origenRepuesto === 'compra_externa',
      cantidad,
      motivoSolicitud: this.form.motivoSolicitud.trim(),
      proveedor: this.form.proveedor.trim() || 'APA',
      disponibleApa: this.form.evento === 'recibir' || this.form.evento === 'entregar',
      cantidadRecibida,
      repuestoValidado: this.form.evento === 'recibir' || this.form.evento === 'entregar',
      entregadoTecnico: this.form.evento === 'entregar',
      tecnicoRecibeId: this.form.evento === 'entregar' ? tecnicoId : undefined,
      diferencias: this.form.diferencias.trim(),
      estadoRepuesto,
    };
  }

  private getEstadoRepuesto(): string {
    if (this.form.evento === 'entregar') return 'entregado_tecnico';
    if (this.form.evento === 'recibir') return 'repuesto_disponible';
    return 'pendiente_repuesto';
  }

  private isFormValid(): boolean {
    return Boolean(
      this.form.evento
        && this.form.tipoRepuesto.trim()
        && this.form.descripcionRepuesto.trim()
        && this.form.origenRepuesto
        && Number(this.form.cantidad) > 0
        && this.form.proveedor.trim()
        && this.form.motivoSolicitud.trim()
    );
  }

  private createEmptyForm(): RepuestoForm {
    return {
      evento: 'solicitar',
      tipoRepuesto: '',
      descripcionRepuesto: '',
      origenRepuesto: 'stock',
      cantidad: 1,
      proveedor: 'APA',
      motivoSolicitud: '',
      cantidadRecibida: 0,
      diferencias: '',
    };
  }
}
