import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  CreateDiagnosticoTecnicoPayload,
  DiagnosticoTecnicoService,
} from '../../../core/services/diagnostico-tecnico.service';

export interface DiagnosticoTicketContext {
  id: string;
  numeroCaso: string;
  fallaReportada: string;
  tecnicoAsignadoId: string;
  tecnicoAsignadoNombre: string;
}

interface DiagnosticoForm {
  fallaEncontrada: string;
  causaProbable: string;
  diagnosticoTecnico: string;
  pruebasRealizadas: string;
  repuestosRequeridos: string;
  requiereAutorizacion: boolean;
}

/**
 * Formulario incremental de Diagnostico Tecnico.
 *
 * Este componente vive dentro del flujo del ticket. Su salida alimenta los
 * modulos futuros de garantia, repuestos y reparacion sin mezclar responsabilidades.
 */
@Component({
  selector: 'app-diagnostico-tecnico',
  imports: [FormsModule, ButtonModule, InputTextModule],
  templateUrl: './diagnostico-tecnico.component.html',
  styleUrl: './diagnostico-tecnico.component.scss',
})
export class DiagnosticoTecnicoComponent {
  @Input() ticket: DiagnosticoTicketContext | null = null;
  @Input() usuarioTemporalId = '';

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected submitted = false;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected form: DiagnosticoForm = this.createEmptyForm();

  constructor(private diagnosticoTecnicoService: DiagnosticoTecnicoService) {}

  protected saveDiagnostico(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.ticket) {
      this.errorMessage = 'Selecciona un ticket antes de registrar diagnostico.';
      return;
    }

    if (!this.isFormValid()) {
      this.errorMessage = 'Completa los campos obligatorios del diagnostico.';
      return;
    }

    const tecnicoId = this.ticket.tecnicoAsignadoId || this.usuarioTemporalId;

    if (!tecnicoId) {
      this.errorMessage = 'El ticket necesita un tecnico asignado para registrar diagnostico.';
      return;
    }

    this.isSaving = true;

    this.diagnosticoTecnicoService
      .createDiagnostico(this.buildPayload(tecnicoId))
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Diagnostico tecnico registrado con exito.';
          this.form = this.createEmptyForm();
          this.submitted = false;
          this.saved.emit();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.error || error.message || 'No se pudo registrar el diagnostico.';
        },
      });
  }

  protected cancelDiagnostico(): void {
    this.form = this.createEmptyForm();
    this.submitted = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.cancelled.emit();
  }

  protected isFieldInvalid(field: keyof DiagnosticoForm): boolean {
    if (field === 'requiereAutorizacion') return false;
    return this.submitted && !String(this.form[field]).trim();
  }

  private buildPayload(tecnicoId: string): CreateDiagnosticoTecnicoPayload {
    const repuestos = this.parseLines(this.form.repuestosRequeridos);

    return {
      ticketId: this.ticket?.id || '',
      numeroCaso: this.ticket?.numeroCaso || '',
      tecnicoId,
      fallaReportada: this.ticket?.fallaReportada || 'Sin falla reportada',
      fallaEncontrada: this.form.fallaEncontrada.trim(),
      causaProbable: this.form.causaProbable.trim(),
      pruebasRealizadas: this.parseLines(this.form.pruebasRealizadas),
      repuestoRequerido: repuestos.length > 0,
      repuestosSugeridos: repuestos.map((descripcion) => ({
        descripcion,
        cantidad: 1,
        motivo: 'Requerido por diagnostico tecnico',
      })),
      requiereGarantiaAutorizacion: this.form.requiereAutorizacion,
      observaciones: this.form.diagnosticoTecnico.trim(),
      resultadoDiagnostico: this.form.requiereAutorizacion
        ? 'requiere_autorizacion'
        : repuestos.length
          ? 'requiere_repuesto'
          : 'diagnosticado',
      estadoDiagnostico: 'diagnosticado',
    };
  }

  private parseLines(value: string): string[] {
    return value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private isFormValid(): boolean {
    return Boolean(
      this.form.fallaEncontrada.trim()
        && this.form.causaProbable.trim()
        && this.form.diagnosticoTecnico.trim()
        && this.form.pruebasRealizadas.trim()
        && this.form.repuestosRequeridos.trim()
    );
  }

  private createEmptyForm(): DiagnosticoForm {
    return {
      fallaEncontrada: '',
      causaProbable: '',
      diagnosticoTecnico: '',
      pruebasRealizadas: '',
      repuestosRequeridos: '',
      requiereAutorizacion: false,
    };
  }
}
