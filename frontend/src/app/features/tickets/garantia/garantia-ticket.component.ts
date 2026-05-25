import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  CreateValidacionGarantiaPayload,
  ValidacionGarantiaService,
} from '../../../core/services/validacion-garantia.service';

export interface GarantiaTicketContext {
  id: string;
  numeroCaso: string;
  cliente: string;
  equipo: string;
}

interface GarantiaForm {
  costoEstimado: number;
  requiereRepuesto: boolean;
  repuestoRequerido: string;
  decisionGarantia: 'pendiente' | 'aprobada' | 'rechazada' | 'no_aplica';
  decisionCliente: 'pendiente' | 'autoriza' | 'rechaza' | 'no_aplica';
  motivoDecision: string;
  evidenciaAutorizacion: string;
}

/**
 * Modulo de Validacion / Garantia del ticket.
 *
 * Se mantiene separado de diagnostico y repuestos para conservar trazabilidad
 * y permitir que el control de estados derive de eventos del flujo.
 */
@Component({
  selector: 'app-garantia-ticket',
  imports: [FormsModule, ButtonModule, InputTextModule],
  templateUrl: './garantia-ticket.component.html',
  styleUrl: './garantia-ticket.component.scss',
})
export class GarantiaTicketComponent {
  @Input() ticket: GarantiaTicketContext | null = null;
  @Input() usuarioTemporalId = '';

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected submitted = false;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected form: GarantiaForm = this.createEmptyForm();

  constructor(private validacionGarantiaService: ValidacionGarantiaService) {}

  protected aprobarGarantia(): void {
    this.form.decisionGarantia = 'aprobada';
    this.form.decisionCliente = 'no_aplica';
  }

  protected rechazarGarantia(): void {
    this.form.decisionGarantia = 'rechazada';
  }

  protected autorizarCliente(): void {
    this.form.decisionCliente = 'autoriza';
    this.form.decisionGarantia = 'no_aplica';
  }

  protected saveGarantia(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.ticket) {
      this.errorMessage = 'Selecciona un ticket antes de validar garantia.';
      return;
    }

    if (!this.isFormValid()) {
      this.errorMessage = 'Registra una decision, costo estimado y motivo.';
      return;
    }

    this.isSaving = true;

    this.validacionGarantiaService
      .createValidacion(this.buildPayload())
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Validacion de garantia registrada con exito.';
          this.form = this.createEmptyForm();
          this.submitted = false;
          this.saved.emit();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.error || error.message || 'No se pudo registrar la validacion.';
        },
      });
  }

  protected cancelGarantia(): void {
    this.form = this.createEmptyForm();
    this.submitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.cancelled.emit();
  }

  protected isTextInvalid(field: 'motivoDecision' | 'evidenciaAutorizacion'): boolean {
    return this.submitted && !this.form[field].trim();
  }

  private buildPayload(): CreateValidacionGarantiaPayload {
    return {
      ticketId: this.ticket?.id || '',
      numeroCaso: this.ticket?.numeroCaso || '',
      tipoValidacion: this.form.decisionGarantia === 'no_aplica'
        ? 'autorizacion_cliente'
        : 'garantia',
      responsableId: this.usuarioTemporalId || undefined,
      clienteInformado: true,
      costoTotalReparacion: Number(this.form.costoEstimado) || 0,
      requiereRepuesto: this.form.requiereRepuesto,
      repuestoRequerido: this.form.repuestoRequerido.trim(),
      decisionGarantia: this.form.decisionGarantia,
      decisionCliente: this.form.decisionCliente,
      motivoDecision: this.form.motivoDecision.trim(),
      evidenciaAutorizacion: this.form.evidenciaAutorizacion.trim(),
      estadoValidacion: this.getEstadoValidacion(),
    };
  }

  private getEstadoValidacion(): string {
    if (this.form.requiereRepuesto) return 'pendiente_repuesto';
    if (this.form.decisionGarantia === 'aprobada') return 'garantia_aprobada';
    if (this.form.decisionCliente === 'autoriza') return 'reparacion_autorizada';
    if (this.form.decisionCliente === 'rechaza') return 'reparacion_no_autorizada';
    return 'pendiente_autorizacion_garantia';
  }

  private isFormValid(): boolean {
    const hasDecision =
      this.form.decisionGarantia !== 'pendiente' || this.form.decisionCliente !== 'pendiente';

    return Boolean(
      hasDecision
        && Number(this.form.costoEstimado) >= 0
        && this.form.motivoDecision.trim()
        && this.form.evidenciaAutorizacion.trim()
    );
  }

  private createEmptyForm(): GarantiaForm {
    return {
      costoEstimado: 0,
      requiereRepuesto: false,
      repuestoRequerido: '',
      decisionGarantia: 'pendiente',
      decisionCliente: 'pendiente',
      motivoDecision: '',
      evidenciaAutorizacion: '',
    };
  }
}
