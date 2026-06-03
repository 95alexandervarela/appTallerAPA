import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap, tap, timeout } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { RecepcionEquipoService } from '../../core/services/recepcion-equipo.service';
import { AuthService } from '../../core/services/auth.service';
import { TicketStatusConfig, TicketStatusService } from '../../core/services/ticket-status.service';
import { TechnicianOption, TicketComment, TicketsService } from '../../core/services/tickets.service';
import {
  TICKET_STATUS_CATALOG,
  getTicketStatusClassName,
  getTicketStatusLabel,
  isTicketStatusInGroup,
} from '../../core/constants/ticket-status.catalog';
import { DiagnosticoTecnicoComponent } from './diagnostico/diagnostico-tecnico.component';
import { GarantiaTicketComponent } from './garantia/garantia-ticket.component';
import { RepuestosTicketComponent } from './repuestos/repuestos-ticket.component';

interface SelectOption {
  label: string;
  value: string;
}

interface TicketResumen {
  id: string;
  numeroCaso: string;
  cliente: string;
  telefonoCliente: string;
  equipo: string;
  marcaEquipo: string;
  modeloEquipo: string;
  serieEquipo: string;
  fallaReportada: string;
  condicionFisica: string;
  accesoriosEntregados: string[];
  tecnicoAsignadoId: string;
  tecnicoAsignadoNombre: string;
  estado: string;
  estadoCodigo: string;
  estadoClassName: string;
  estadoBackground: string;
  estadoBorderColor: string;
  estadoTextColor: string;
  prioridad: string;
  fechaCreacion: string;
}

interface TicketForm {
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
  prioridad: string;
}

type TicketStatusFilter = 'pendiente' | 'diagnostico' | 'reparacion' | '';
type TicketDateSortOrder = 'recent' | 'oldest';

/**
 * Se implementó generación temporal del número de caso.
 * Se añadió dashboard de tickets.
 * Se separó flujo entre listado y creación usando el formulario de recepcion de equipo.
 */
@Component({
  selector: 'app-tickets',
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    DiagnosticoTecnicoComponent,
    GarantiaTicketComponent,
    RepuestosTicketComponent,
    InputTextModule,
    SelectModule,
    TagModule,
  ],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss',
})
export class TicketsComponent implements OnInit, AfterViewInit {
  @ViewChild('ticketCommentsList') private ticketCommentsList?: ElementRef<HTMLElement>;

  protected vistaActual: 'dashboard' | 'crear' = 'dashboard';
  protected busquedaTicket = '';
  protected isSavingTicket = false;
  protected isTicketSuccessDialogOpen = false;
  protected isTicketDetailDialogOpen = false;
  protected isAssignTechnicianDialogOpen = false;
  protected isDiagnosticoDialogOpen = false;
  protected isGarantiaDialogOpen = false;
  protected isRepuestosDialogOpen = false;
  protected ticketSubmitted = false;
  protected ticketErrorMessage = '';
  protected ticketSuccessMessage = '';
  protected assignTicketErrorMessage = '';
  protected statusUpdateMessage = '';
  protected statusUpdateErrorMessage = '';
  protected ticketCommentErrorMessage = '';
  protected selectedTechnicianId = '';
  protected selectedStatusCode = '';
  protected newTicketComment = '';
  protected clientNameFilter = '';
  protected selectedStateFilter = '';
  protected selectedEquipmentFilter = '';
  protected selectedTechnicianFilter = '';
  protected dateSortOrder: TicketDateSortOrder = 'recent';
  protected filterStatus: TicketStatusFilter = '';
  protected isAssigningTicket = false;
  protected isUpdatingStatus = false;
  protected isLoadingTicketComments = false;
  protected isSendingTicketComment = false;
  protected selectedTicket: TicketResumen | null = null;
  protected usuarioTemporalId = '';

  protected readonly origenOptions: SelectOption[] = [
    { label: 'Cliente final', value: 'cliente_final' },
    { label: 'Sucursal', value: 'sucursal' },
    { label: 'Ventas', value: 'ventas' },
    { label: 'Garantia', value: 'garantia' },
    { label: 'Traslado interno', value: 'traslado_interno' },
    { label: 'Area APA', value: 'area_apa' },
    { label: 'Otro', value: 'otro' },
  ];

  protected readonly estadoOptions: SelectOption[] = [
    { label: 'Registrado', value: 'registrado' },
    { label: 'En diagnostico', value: 'en_diagnostico' },
    { label: 'Equipo no ingresado', value: 'equipo_no_ingresado' },
  ];

  protected readonly prioridadOptions: SelectOption[] = [
    { label: 'Baja', value: 'baja' },
    { label: 'Media', value: 'media' },
    { label: 'Alta', value: 'alta' },
    { label: 'Urgente', value: 'urgente' },
  ];
  protected readonly dateSortOptions: SelectOption[] = [
    { label: 'Más recientes', value: 'recent' },
    { label: 'Más antiguos', value: 'oldest' },
  ];

  protected ticketStatusOptions: SelectOption[] = Object.values(TICKET_STATUS_CATALOG)
    .sort((firstStatus, secondStatus) => firstStatus.order - secondStatus.order)
    .map((status) => ({
      label: status.label,
      value: status.code,
    }));
  private ticketStatusMap = new Map<string, TicketStatusConfig>();

  protected tickets: TicketResumen[] = [];
  protected technicianOptions: SelectOption[] = [];
  protected ticketComments: TicketComment[] = [];

  protected ticketForm: TicketForm = this.createEmptyTicketForm();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recepcionEquipoService: RecepcionEquipoService,
    private ticketsService: TicketsService,
    private ticketStatusService: TicketStatusService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.watchStatusFilter();
    this.loadUsuarioTemporal();
    this.loadTicketStatuses();
    this.loadTechnicians();
    this.loadTickets();
  }

  ngAfterViewInit(): void {
    console.log('overview boton renderizado');
  }

  protected get ticketsFiltrados(): TicketResumen[] {
    const value = this.busquedaTicket.trim().toLowerCase();
    let filteredTickets = this.applyTicketFilters(
      this.filterTicketsByStatus(this.filterTicketsForCurrentUser(this.tickets)),
    );
    filteredTickets = this.sortTicketsByDate(filteredTickets);

    if (!value) return filteredTickets.slice(0, 20);

    return filteredTickets
      .filter((ticket) =>
        [ticket.numeroCaso, ticket.cliente, ticket.equipo, ticket.estado]
        .join(' ')
        .toLowerCase()
        .includes(value),
      )
      .slice(0, 20);
  }

  protected get ticketStateFilterOptions(): SelectOption[] {
    const options = this.buildUniqueFilterOptions(
      this.filterTicketsForCurrentUser(this.tickets),
      (ticket) => ticket.estado,
    );

    return [{ label: 'Todos los estados', value: '' }, ...options];
  }

  protected get equipmentFilterOptions(): SelectOption[] {
    const options = this.buildUniqueFilterOptions(
      this.filterTicketsForCurrentUser(this.tickets),
      (ticket) => ticket.equipo,
    );

    return [{ label: 'Todos los equipos', value: '' }, ...options];
  }

  protected get canFilterByTechnician(): boolean {
    return !this.authService.isTecnico();
  }

  protected get technicianFilterOptions(): SelectOption[] {
    const currentTickets = this.filterTicketsForCurrentUser(this.tickets);
    const assignedTechnicianIds = new Set(
      currentTickets
        .map((ticket) => ticket.tecnicoAsignadoId)
        .filter((technicianId) => !!technicianId),
    );
    const knownTechnicianOptions = this.technicianOptions.filter((technician) =>
      assignedTechnicianIds.has(technician.value),
    );
    const fallbackOptions = currentTickets
      .filter((ticket) => !!ticket.tecnicoAsignadoId && !!ticket.tecnicoAsignadoNombre)
      .map((ticket) => ({
        label: ticket.tecnicoAsignadoNombre,
        value: ticket.tecnicoAsignadoId,
      }));
    const optionMap = new Map<string, SelectOption>();

    [...knownTechnicianOptions, ...fallbackOptions].forEach((option) => {
      if (option.value && !optionMap.has(option.value)) {
        optionMap.set(option.value, option);
      }
    });

    const options = Array.from(optionMap.values()).sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label, 'es', { sensitivity: 'base' }),
    );

    return [{ label: 'Todos los técnicos', value: '' }, ...options];
  }

  protected get hasUsableTicketDate(): boolean {
    return this.tickets.some((ticket) => Number.isFinite(new Date(ticket.fechaCreacion).getTime()));
  }

  /**
   * Lee `status` desde query params para reutilizar esta misma pantalla.
   *
   * @remarks
   * Permite navegar desde Overview hacia `/tickets`, `/tickets?status=pendiente`,
   * `/tickets?status=diagnostico` o `/tickets?status=reparacion` sin crear vistas duplicadas.
   */
  private watchStatusFilter(): void {
    this.route.queryParams.subscribe((params) => {
      this.filterStatus = this.normalizeStatusFilter(params['status']);
      this.cdr.detectChanges();
    });
  }

  private normalizeStatusFilter(value: unknown): TicketStatusFilter {
    if (value === 'pendiente' || value === 'pendientes') return 'pendiente';
    if (value === 'diagnostico') return 'diagnostico';
    if (value === 'reparacion') return 'reparacion';
    return '';
  }

  private filterTicketsByStatus(tickets: TicketResumen[]): TicketResumen[] {
    if (!this.filterStatus) return tickets;

    return tickets.filter((ticket) => this.matchesStatusFilter(ticket.estadoCodigo));
  }

  private filterTicketsForCurrentUser(tickets: TicketResumen[]): TicketResumen[] {
    if (!this.authService.isTecnico()) return tickets;

    const currentUserId = this.authService.getCurrentUserId();
    return tickets.filter((ticket) => ticket.tecnicoAsignadoId === currentUserId);
  }

  private matchesStatusFilter(estadoCodigo: string): boolean {
    if (this.filterStatus === 'pendiente') {
      return isTicketStatusInGroup(estadoCodigo, ['pendiente', 'garantia', 'repuesto']);
    }

    if (this.filterStatus === 'diagnostico') {
      return isTicketStatusInGroup(estadoCodigo, ['diagnostico']);
    }

    if (this.filterStatus === 'reparacion') {
      return isTicketStatusInGroup(estadoCodigo, ['reparacion']);
    }

    return true;
  }

  private applyTicketFilters(tickets: TicketResumen[]): TicketResumen[] {
    const clientName = this.clientNameFilter.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesClient =
        !clientName || ticket.cliente.toLowerCase().includes(clientName);
      const matchesState =
        !this.selectedStateFilter || ticket.estado === this.selectedStateFilter;
      const matchesEquipment =
        !this.selectedEquipmentFilter || ticket.equipo === this.selectedEquipmentFilter;
      const matchesTechnician =
        !this.selectedTechnicianFilter || ticket.tecnicoAsignadoId === this.selectedTechnicianFilter;

      return matchesClient && matchesState && matchesEquipment && matchesTechnician;
    });
  }

  private sortTicketsByDate(tickets: TicketResumen[]): TicketResumen[] {
    if (!this.hasUsableTicketDate) return [...tickets];

    const direction = this.dateSortOrder === 'oldest' ? 1 : -1;

    return [...tickets].sort((firstTicket, secondTicket) => {
      const firstDate = new Date(firstTicket.fechaCreacion).getTime();
      const secondDate = new Date(secondTicket.fechaCreacion).getTime();
      const safeFirstDate = Number.isFinite(firstDate) ? firstDate : 0;
      const safeSecondDate = Number.isFinite(secondDate) ? secondDate : 0;

      return (safeFirstDate - safeSecondDate) * direction;
    });
  }

  private buildUniqueFilterOptions(
    tickets: TicketResumen[],
    valueSelector: (ticket: TicketResumen) => string,
  ): SelectOption[] {
    return Array.from(
      new Set(
        tickets
          .map(valueSelector)
          .filter((value) => !!value),
      ),
    )
      .sort((firstValue, secondValue) => firstValue.localeCompare(secondValue, 'es', { sensitivity: 'base' }))
      .map((value) => ({ label: value, value }));
  }

  protected abrirFormulario(): void {
    if (!this.canCreateTicket()) return;

    this.ticketErrorMessage = '';
    this.ticketSubmitted = false;
    this.ticketForm = {
      ...this.createEmptyTicketForm(),
      numeroCaso: this.generarNumeroCasoTemporal(),
    };
    this.vistaActual = 'crear';
  }

  protected openFullTicketsView(): void {
    this.router.navigate(['/tickets/history']);
  }

  protected clearTicketFilters(): void {
    this.clientNameFilter = '';
    this.selectedStateFilter = '';
    this.selectedEquipmentFilter = '';
    this.selectedTechnicianFilter = '';
    this.dateSortOrder = 'recent';
  }

  protected cancelarCreacion(): void {
    this.ticketForm = this.createEmptyTicketForm();
    this.ticketErrorMessage = '';
    this.ticketSubmitted = false;
    this.vistaActual = 'dashboard';
  }

  /**
   * Se optimizó flujo de guardado reduciendo tiempo percibido mediante mejora
   * en async y feedback inmediato.
   */
  protected guardarTicket(): void {
    if (this.isSavingTicket) return;

    this.ticketSubmitted = true;
    this.ticketErrorMessage = '';
    this.ticketSuccessMessage = '';

    if (!this.canCreateTicket()) {
      this.ticketErrorMessage = 'Tu perfil no permite crear tickets.';
      return;
    }

    if (!this.isTicketFormValid()) {
      this.ticketErrorMessage = 'Completa los datos requeridos antes de guardar.';
      this.isSavingTicket = false;
      return;
    }

    if (!this.usuarioTemporalId) {
      this.ticketErrorMessage = 'No hay un usuario disponible para crear el ticket.';
      this.isSavingTicket = false;
      return;
    }

    this.isSavingTicket = true;
    const numeroCaso = this.ticketForm.numeroCaso;

    const recepcionPayload = {
      numeroCaso,
      origenEquipo: this.ticketForm.origenEquipo,
      nombreCliente: this.ticketForm.nombreCliente,
      telefonoCliente: this.ticketForm.telefonoCliente,
      correoCliente: this.ticketForm.correoCliente,
      sucursalOrigen: this.ticketForm.sucursalOrigen,
      tipoEquipo: this.ticketForm.tipoEquipo,
      marcaEquipo: this.ticketForm.marcaEquipo,
      modeloEquipo: this.ticketForm.modeloEquipo,
      serieEquipo: this.ticketForm.serieEquipo,
      fallaReportada: this.ticketForm.fallaReportada,
      condicionFisica: this.ticketForm.condicionFisica,
      accesoriosEntregados: this.parseAccesorios(this.ticketForm.accesoriosEntregados),
      datosCompletos: this.ticketForm.datosCompletos,
      esCasoEspecial: this.ticketForm.esCasoEspecial,
      ingresoAutorizado: this.ticketForm.ingresoAutorizado,
      referenciaSap: this.ticketForm.referenciaSap,
      comprobanteEntregado: this.ticketForm.comprobanteEntregado,
      equipoEtiquetado: this.ticketForm.equipoEtiquetado,
      estadoRecepcion: this.ticketForm.estadoRecepcion,
      recibidoPor: this.usuarioTemporalId,
    };

    this.recepcionEquipoService
      .createRecepcion(recepcionPayload)
      .pipe(
        timeout(15000),
        tap(() => {
          this.isSavingTicket = false;
          this.ticketSuccessMessage = `Ticket ${numeroCaso} creado con éxito.`;
          this.isTicketSuccessDialogOpen = true;
        }),
        switchMap((response) => {
          return this.ticketsService.createTicket({
            numeroTicket: numeroCaso,
            recepcionEquipoId: response.recepcion._id,
            creadoPor: this.usuarioTemporalId,
            prioridad: this.ticketForm.prioridad,
            estadoTicket: 'creado',
          }).pipe(timeout(15000));
        }),
        finalize(() => {
          this.isSavingTicket = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.ticketSuccessMessage = `Ticket ${response.ticket.numeroTicket} creado con éxito.`;
          this.tickets = [...this.tickets, this.mapTicketResponse(response.ticket)];
          this.isTicketSuccessDialogOpen = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          const errorMessage =
            error.error?.error ||
            error.error?.message ||
            (error.name === 'TimeoutError'
              ? 'El servidor no respondió a tiempo. Revisa que el backend esté activo.'
              : error.message) ||
            'No se pudo crear el ticket.';
          this.isTicketSuccessDialogOpen = false;
          this.ticketErrorMessage = errorMessage;
          this.cdr.detectChanges();
        },
      });
  }

  protected closeTicketSuccessDialog(): void {
    this.isTicketSuccessDialogOpen = false;
    this.ticketSuccessMessage = '';
    this.cancelarCreacion();
    this.loadTickets();
  }

  protected openTicketDetail(ticket: TicketResumen): void {
    this.selectedTicket = ticket;
    this.selectedStatusCode = ticket.estadoCodigo;
    this.statusUpdateMessage = '';
    this.statusUpdateErrorMessage = '';
    this.ticketCommentErrorMessage = '';
    this.newTicketComment = '';
    this.ticketComments = [];
    this.isTicketDetailDialogOpen = true;
    this.loadTicketComments(ticket.id);
  }

  protected closeTicketDetail(): void {
    this.isTicketDetailDialogOpen = false;
    this.selectedStatusCode = '';
    this.statusUpdateMessage = '';
    this.statusUpdateErrorMessage = '';
    this.ticketCommentErrorMessage = '';
    this.newTicketComment = '';
    this.ticketComments = [];
  }

  protected openAssignTechnicianDialog(): void {
    if (!this.selectedTicket || !this.canAssignTechnician()) return;

    this.assignTicketErrorMessage = '';
    this.selectedTechnicianId = this.selectedTicket.tecnicoAsignadoId;
    this.isAssignTechnicianDialogOpen = true;
  }

  protected closeAssignTechnicianDialog(): void {
    this.isAssignTechnicianDialogOpen = false;
    this.assignTicketErrorMessage = '';
    this.selectedTechnicianId = '';
  }

  protected openDiagnosticoDialog(): void {
    if (!this.selectedTicket || !this.canRegisterDiagnostico()) return;

    this.isDiagnosticoDialogOpen = true;
  }

  protected closeDiagnosticoDialog(): void {
    this.isDiagnosticoDialogOpen = false;
  }

  protected onDiagnosticoSaved(): void {
    this.closeDiagnosticoDialog();
    this.loadTickets();
  }

  protected openGarantiaDialog(): void {
    if (!this.selectedTicket || !this.canValidateGarantia()) return;

    this.isGarantiaDialogOpen = true;
  }

  protected closeGarantiaDialog(): void {
    this.isGarantiaDialogOpen = false;
  }

  protected onGarantiaSaved(): void {
    this.closeGarantiaDialog();
    this.loadTickets();
  }

  protected openRepuestosDialog(): void {
    if (!this.selectedTicket || !this.canManageRepuestos()) return;

    this.isRepuestosDialogOpen = true;
  }

  protected closeRepuestosDialog(): void {
    this.isRepuestosDialogOpen = false;
  }

  protected onRepuestoSaved(): void {
    this.closeRepuestosDialog();
    this.loadTickets();
  }

  protected canManageRepuestos(): boolean {
    if (!this.selectedTicket) return false;
    if (this.authService.isTecnico() && !this.isSelectedTicketOwnedByCurrentUser()) return false;
    return this.selectedTicket.estadoCodigo !== 'pendiente_aprobacion';
  }

  protected assignTechnician(): void {
    if (!this.selectedTicket || !this.canAssignTechnician()) return;

    if (!this.selectedTechnicianId) {
      this.assignTicketErrorMessage = 'Selecciona un tecnico para asignar el ticket.';
      return;
    }

    this.isAssigningTicket = true;
    this.assignTicketErrorMessage = '';

    this.ticketsService
      .assignTechnician(this.selectedTicket.id, { tecnicoAsignado: this.selectedTechnicianId })
      .pipe(
        finalize(() => {
          this.isAssigningTicket = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const updatedTicket = this.mapTicketResponse(response.ticket);
          this.tickets = this.tickets.map((ticket) =>
            ticket.id === updatedTicket.id ? updatedTicket : ticket,
          );
          this.selectedTicket = updatedTicket;
          this.closeAssignTechnicianDialog();
        },
        error: (error) => {
          this.assignTicketErrorMessage =
            error.error?.error || error.message || 'No se pudo asignar el tecnico.';
        },
      });
  }

  protected canCreateTicket(): boolean {
    return !this.authService.isTecnico();
  }

  protected canAssignTechnician(): boolean {
    return this.authService.isAdministrador();
  }

  protected canRegisterDiagnostico(): boolean {
    return this.authService.isAdministrador() || this.isSelectedTicketOwnedByCurrentUser();
  }

  protected canValidateGarantia(): boolean {
    return this.authService.isAdministrador();
  }

  protected canUpdateTicketStatus(): boolean {
    return !!this.selectedTicket;
  }

  protected get statusOptionsForCurrentUser(): SelectOption[] {
    return this.ticketStatusOptions;
  }

  /**
   * Actualiza el estado desde la pildora interactiva del detalle.
   *
   * @remarks
   * El backend conserva la validacion definitiva, incluida la proteccion de
   * tickets finalizados.
   */
  protected updateSelectedTicketStatus(nextStatusCode: string): void {
    if (!this.selectedTicket || !this.canUpdateTicketStatus() || !nextStatusCode || this.isUpdatingStatus) {
      return;
    }

    if (nextStatusCode === this.selectedTicket.estadoCodigo) {
      this.selectedStatusCode = nextStatusCode;
      return;
    }

    const previousStatusCode = this.selectedTicket.estadoCodigo;
    this.selectedStatusCode = nextStatusCode;

    this.isUpdatingStatus = true;
    this.statusUpdateMessage = '';
    this.statusUpdateErrorMessage = '';

    this.ticketsService
      .updateTicketStatus(this.selectedTicket.id, { estadoTicket: nextStatusCode })
      .pipe(
        finalize(() => {
          this.isUpdatingStatus = false;
        }),
      )
      .subscribe({
        next: (response) => {
          const updatedTicket = this.mapTicketResponse(response.ticket);
          this.tickets = this.tickets.map((ticket) =>
            ticket.id === updatedTicket.id ? updatedTicket : ticket,
          );
          this.selectedTicket = updatedTicket;
          this.selectedStatusCode = updatedTicket.estadoCodigo;
          this.statusUpdateMessage = 'Estado actualizado.';
        },
        error: (error) => {
          this.selectedStatusCode = previousStatusCode;
          this.statusUpdateErrorMessage =
            error.error?.error || error.message || 'No se pudo actualizar el estado.';
        },
      });
  }

  protected sendTicketComment(): void {
    if (!this.selectedTicket || this.isSendingTicketComment) return;

    const message = this.newTicketComment.trim();

    if (!message) {
      this.ticketCommentErrorMessage = 'Escribe un comentario antes de enviar.';
      return;
    }

    this.isSendingTicketComment = true;
    this.ticketCommentErrorMessage = '';

    this.ticketsService
      .createTicketComment(this.selectedTicket.id, message)
      .pipe(
        finalize(() => {
          this.isSendingTicketComment = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.ticketComments = [...this.ticketComments, response.comment];
          this.newTicketComment = '';
          this.scrollTicketCommentsToBottom();
        },
        error: (error) => {
          this.ticketCommentErrorMessage =
            error.error?.error || error.message || 'No se pudo agregar el comentario.';
        },
      });
  }

  protected getCommentAuthor(comment: TicketComment): string {
    if (!comment.userId || typeof comment.userId === 'string') return 'Usuario';
    return comment.userId.nombre_completo || comment.userId.username || 'Usuario';
  }

  protected formatCommentDate(value: string): string {
    const createdAt = new Date(value).getTime();
    const diffMs = Date.now() - createdAt;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (!Number.isFinite(createdAt)) return '';
    if (diffMs < minute) return 'hace un momento';
    if (diffMs < hour) return `hace ${Math.floor(diffMs / minute)} min`;
    if (diffMs < day) return `hace ${Math.floor(diffMs / hour)} h`;
    if (diffMs < 7 * day) return `hace ${Math.floor(diffMs / day)} d`;

    return new Date(value).toLocaleString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected isFieldInvalid(field: keyof TicketForm): boolean {
    return this.ticketSubmitted && !String(this.ticketForm[field]).trim();
  }

  private generarNumeroCasoTemporal(): string {
    const ultimoNumero = this.tickets.reduce((max, ticket) => {
      const value = Number(ticket.numeroCaso.replace('EMUS-', ''));
      return Number.isFinite(value) && value > max ? value : max;
    }, 0);
    const siguienteNumero = ultimoNumero + 1;
    return `EMUS-${String(siguienteNumero).padStart(5, '0')}`;
  }

  private loadUsuarioTemporal(): void {
    this.usuarioTemporalId = this.authService.getCurrentUserId();
  }

  private loadTickets(): void {
    this.ticketsService.getTicketsForCurrentUser().subscribe({
      next: (tickets) => {
        // Se corrigió carga de actividad reciente forzando change detection y asegurando render inmediato de datos.
        this.tickets = tickets.map((ticket) => this.mapTicketResponse(ticket));
        this.cdr.detectChanges();
      },
      error: () => {
        this.tickets = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadTicketStatuses(): void {
    this.ticketStatusService.getActiveStatuses().subscribe({
      next: (statuses) => {
        const activeStatuses = statuses.filter((status) => status.isActive !== false);

        if (activeStatuses.length) {
          this.ticketStatusMap = new Map(activeStatuses.map((status) => [status.code, status]));
          this.ticketStatusOptions = activeStatuses
            .sort((firstStatus, secondStatus) => firstStatus.order - secondStatus.order)
            .map((status) => ({
              label: status.name,
              value: status.code,
            }));
          this.tickets = this.tickets.map((ticket) => ({
            ...ticket,
            ...this.getStatusPresentation(ticket.estadoCodigo),
          }));
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.ticketStatusMap = new Map();
      },
    });
  }

  private loadTicketComments(ticketId: string): void {
    this.isLoadingTicketComments = true;
    this.ticketCommentErrorMessage = '';

    this.ticketsService
      .getTicketComments(ticketId)
      .pipe(
        finalize(() => {
          this.isLoadingTicketComments = false;
        }),
      )
      .subscribe({
        next: (comments) => {
          if (this.selectedTicket?.id !== ticketId) return;
          this.ticketComments = comments;
          this.scrollTicketCommentsToBottom();
        },
        error: (error) => {
          this.ticketComments = [];
          this.ticketCommentErrorMessage =
            error.error?.error || error.message || 'No se pudieron cargar los comentarios.';
        },
      });
  }

  private loadTechnicians(): void {
    if (this.authService.isTecnico()) {
      this.technicianOptions = [];
      return;
    }

    this.ticketsService.getTechnicians().subscribe({
      next: (technicians) => {
        this.technicianOptions = technicians.map((technician) => ({
          label: technician.nombre_completo,
          value: technician._id,
        }));
      },
      error: () => {
        this.technicianOptions = [];
      },
    });
  }

  private mapTicketResponse(ticket: any): TicketResumen {
    const statusPresentation = this.getStatusPresentation(ticket.estadoTicket);

    return {
      id: ticket._id,
      numeroCaso: ticket.numeroTicket,
      cliente: ticket.nombreCliente,
      telefonoCliente: ticket.telefonoCliente || '',
      equipo: ticket.tipoEquipo,
      marcaEquipo: ticket.marcaEquipo || '',
      modeloEquipo: ticket.modeloEquipo || '',
      serieEquipo: ticket.serieEquipo || '',
      fallaReportada: ticket.fallaReportada || '',
      condicionFisica: ticket.condicionFisica || '',
      accesoriosEntregados: ticket.accesoriosEntregados || [],
      tecnicoAsignadoId: this.getTechnicianId(ticket.tecnicoAsignado),
      tecnicoAsignadoNombre: this.getTechnicianName(ticket.tecnicoAsignado),
      estado: statusPresentation.estado,
      estadoCodigo: ticket.estadoTicket,
      estadoClassName: statusPresentation.estadoClassName,
      estadoBackground: statusPresentation.estadoBackground,
      estadoBorderColor: statusPresentation.estadoBorderColor,
      estadoTextColor: statusPresentation.estadoTextColor,
      prioridad: ticket.prioridad,
      fechaCreacion: ticket.fechaCreacion || '',
    };
  }

  private getStatusPresentation(statusCode: string): Pick<
    TicketResumen,
    'estado' | 'estadoClassName' | 'estadoBackground' | 'estadoBorderColor' | 'estadoTextColor'
  > {
    const configuredStatus = this.ticketStatusMap.get(statusCode);

    if (configuredStatus && !configuredStatus.isLegacy) {
      return {
        estado: configuredStatus.name,
        estadoClassName: 'status-badge status-badge--configured',
        estadoBackground: this.withAlpha(configuredStatus.color, '29'),
        estadoBorderColor: this.withAlpha(configuredStatus.color, '47'),
        estadoTextColor: '#e2e8f0',
      };
    }

    return {
      estado: configuredStatus?.name || getTicketStatusLabel(statusCode),
      estadoClassName: getTicketStatusClassName(statusCode),
      estadoBackground: '',
      estadoBorderColor: '',
      estadoTextColor: '',
    };
  }

  private withAlpha(color: string, alphaHex: string): string {
    const value = color.trim();
    return /^#[0-9a-f]{6}$/i.test(value) ? `${value}${alphaHex}` : value;
  }

  private getTechnicianId(value: TechnicianOption | string | null | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value._id;
  }

  private getTechnicianName(value: TechnicianOption | string | null | undefined): string {
    if (!value || typeof value === 'string') return '';
    return value.nombre_completo || value.username;
  }

  private scrollTicketCommentsToBottom(): void {
    setTimeout(() => {
      const commentsList = this.ticketCommentsList?.nativeElement;
      if (!commentsList) return;
      commentsList.scrollTop = commentsList.scrollHeight;
    });
  }

  private isSelectedTicketOwnedByCurrentUser(): boolean {
    return (
      !!this.selectedTicket &&
      !!this.selectedTicket.tecnicoAsignadoId &&
      this.selectedTicket.tecnicoAsignadoId === this.authService.getCurrentUserId()
    );
  }

  private parseAccesorios(value: string): string[] {
    return value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private isTicketFormValid(): boolean {
    const requiredFields: Array<keyof TicketForm> = [
      'origenEquipo',
      'nombreCliente',
      'telefonoCliente',
      'tipoEquipo',
      'fallaReportada',
      'condicionFisica',
    ];

    return requiredFields.every((field) => String(this.ticketForm[field]).trim());
  }

  private createEmptyTicketForm(): TicketForm {
    return {
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
      estadoRecepcion: 'registrado',
      prioridad: 'media',
    };
  }
}
