import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import {
  TicketStatusConfig,
  TicketStatusPayload,
  TicketStatusService,
} from '../../core/services/ticket-status.service';

interface StatusForm {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  isFinal: boolean;
  isActive: boolean;
  order: number;
}

interface BadgeStyle {
  background: string;
  borderColor: string;
  color: string;
}

/**
 * Panel administrativo de estados configurables.
 *
 * @remarks
 * Permite crear, editar, activar/desactivar, ordenar y eliminar estados sin
 * tocar el enum legacy ni romper la logica actual del flujo de tickets.
 */
@Component({
  selector: 'app-ticket-status-panel',
  imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, TagModule],
  templateUrl: './ticket-status-panel.component.html',
  styleUrl: './ticket-status-panel.component.scss',
})
export class TicketStatusPanelComponent implements OnInit {
  protected statuses: TicketStatusConfig[] = [];
  protected selectedStatus: TicketStatusConfig | null = null;
  protected statusForm: StatusForm = this.createEmptyStatusForm();
  protected isLoadingStatuses = false;
  protected isSavingStatus = false;
  protected isDeletingStatus = false;
  protected isStatusDialogOpen = false;
  protected isDeleteDialogOpen = false;
  protected isEditMode = false;
  protected submitted = false;
  protected statusErrorMessage = '';
  protected statusSuccessMessage = '';

  constructor(
    private ticketStatusService: TicketStatusService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadStatuses();
  }

  protected loadStatuses(): void {
    this.isLoadingStatuses = true;
    this.statusErrorMessage = '';

    this.ticketStatusService
      .getStatuses()
      .pipe(
        finalize(() => {
          this.isLoadingStatuses = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (statuses) => {
          console.log('statuses response', statuses);
          this.statuses = statuses;
        },
        error: (error) => {
          console.error('ticket statuses load error', error);
          this.statuses = [];
          this.statusErrorMessage = this.getStatusesLoadErrorMessage(error);
        },
      });
  }

  protected openCreateStatusDialog(): void {
    this.isEditMode = false;
    this.submitted = false;
    this.statusErrorMessage = '';
    this.statusSuccessMessage = '';
    this.selectedStatus = null;
    this.statusForm = this.createEmptyStatusForm();
    this.isStatusDialogOpen = true;
  }

  protected openEditStatusDialog(status: TicketStatusConfig): void {
    this.isEditMode = !status.isLegacy;
    this.submitted = false;
    this.statusErrorMessage = '';
    this.statusSuccessMessage = '';
    this.selectedStatus = status;
    this.statusForm = {
      id: status.isLegacy ? '' : status._id,
      name: status.name,
      code: status.code,
      description: status.description || '',
      color: status.color || '#38bdf8',
      isFinal: status.isFinal,
      isActive: status.isActive,
      order: status.order,
    };
    this.isStatusDialogOpen = true;
  }

  protected closeStatusDialog(): void {
    this.isStatusDialogOpen = false;
    this.isEditMode = false;
    this.submitted = false;
    this.statusErrorMessage = '';
    this.statusSuccessMessage = '';
    this.selectedStatus = null;
    this.statusForm = this.createEmptyStatusForm();
  }

  protected openDeleteStatusDialog(status: TicketStatusConfig): void {
    if (status.isLegacy) return;

    this.selectedStatus = status;
    this.statusErrorMessage = '';
    this.isDeleteDialogOpen = true;
  }

  protected closeDeleteStatusDialog(): void {
    this.isDeleteDialogOpen = false;
    this.statusErrorMessage = '';
  }

  protected saveStatus(): void {
    this.submitted = true;
    this.statusErrorMessage = '';
    this.statusSuccessMessage = '';

    if (!this.statusForm.name.trim()) {
      this.statusErrorMessage = 'Nombre es requerido.';
      return;
    }

    const payload = this.buildStatusPayload();
    const request =
      this.isEditMode && this.statusForm.id
        ? this.ticketStatusService.updateStatus(this.statusForm.id, payload)
        : this.ticketStatusService.createStatus(payload);

    this.isSavingStatus = true;

    request
      .pipe(
        finalize(() => {
          this.isSavingStatus = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.statusSuccessMessage = response.message;
          this.closeStatusDialog();
          this.loadStatuses();
        },
        error: (error) => {
          this.statusErrorMessage =
            error.error?.error || error.message || 'No se pudo guardar el estado.';
        },
      });
  }

  protected deleteStatus(): void {
    if (!this.selectedStatus) return;

    this.isDeletingStatus = true;
    this.statusErrorMessage = '';

    const request = this.selectedStatus.isLegacy
      ? this.ticketStatusService.createStatus({
          name: this.selectedStatus.name,
          code: this.selectedStatus.code,
          description: this.selectedStatus.description || '',
          color: this.selectedStatus.color,
          isFinal: this.selectedStatus.isFinal,
          isActive: false,
          order: this.selectedStatus.order,
        })
      : this.ticketStatusService.deleteStatus(this.selectedStatus._id);

    request
      .pipe(
        finalize(() => {
          this.isDeletingStatus = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.closeDeleteStatusDialog();
          this.loadStatuses();
        },
        error: (error) => {
          this.statusErrorMessage =
            error.error?.error || error.message || 'No se pudo eliminar el estado.';
        },
      });
  }

  protected toggleStatusActive(status: TicketStatusConfig): void {
    const payload: TicketStatusPayload = {
      name: status.name,
      code: status.code,
      description: status.description || '',
      color: status.color,
      isFinal: status.isFinal,
      isActive: !status.isActive,
      order: status.order,
    };

    const request = status.isLegacy
      ? this.ticketStatusService.createStatus(payload)
      : this.ticketStatusService.updateStatus(status._id, payload);

    request.subscribe({
      next: () => this.loadStatuses(),
      error: (error) => {
        this.statusErrorMessage =
          error.error?.error || error.message || 'No se pudo cambiar el estado.';
      },
    });
  }

  protected onNameChange(): void {
    if (this.isEditMode || this.statusForm.code.trim()) return;
    this.statusForm.code = this.slugify(this.statusForm.name);
  }

  protected getBadgeStyle(status: TicketStatusConfig): BadgeStyle {
    return {
      background: this.withAlpha(status.color, '29'),
      borderColor: this.withAlpha(status.color, '47'),
      color: '#e2e8f0',
    };
  }

  private buildStatusPayload(): TicketStatusPayload {
    return {
      name: this.statusForm.name.trim(),
      code: this.slugify(this.statusForm.code || this.statusForm.name),
      description: this.statusForm.description.trim(),
      color: this.statusForm.color || '#38bdf8',
      isFinal: this.statusForm.isFinal,
      isActive: this.statusForm.isActive,
      order: Number(this.statusForm.order) || 999,
    };
  }

  private createEmptyStatusForm(): StatusForm {
    return {
      id: '',
      name: '',
      code: '',
      description: '',
      color: '#38bdf8',
      isFinal: false,
      isActive: true,
      order: 999,
    };
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private withAlpha(color: string, alphaHex: string): string {
    const value = color.trim();
    return /^#[0-9a-f]{6}$/i.test(value) ? `${value}${alphaHex}` : value;
  }

  private getStatusesLoadErrorMessage(error: any): string {
    if (error?.status === 404) return 'Error cargando estados: endpoint no disponible.';
    if (error?.status === 500) return 'Error cargando estados: error del servidor.';
    if (error?.status === 0) return 'Error cargando estados: no hay conexion con el backend.';
    return 'Error cargando estados.';
  }
}
