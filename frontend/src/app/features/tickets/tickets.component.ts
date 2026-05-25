import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { RecepcionEquipoService } from '../../core/services/recepcion-equipo.service';
import { TechnicianOption, TicketsService } from '../../core/services/tickets.service';
import { UsersService } from '../../core/services/users.service';
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
}

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
  styleUrl: './tickets.component.scss'
})
export class TicketsComponent implements OnInit {
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
  protected selectedTechnicianId = '';
  protected isAssigningTicket = false;
  protected selectedTicket: TicketResumen | null = null;
  protected usuarioTemporalId = '';

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

  protected tickets: TicketResumen[] = [];
  protected technicianOptions: SelectOption[] = [];

  protected ticketForm: TicketForm = this.createEmptyTicketForm();

  constructor(
    private recepcionEquipoService: RecepcionEquipoService,
    private ticketsService: TicketsService,
    private usersService: UsersService,
  ) {}

  ngOnInit(): void {
    this.loadUsuarioTemporal();
    this.loadTechnicians();
    this.loadTickets();
  }

  protected get ticketsFiltrados(): TicketResumen[] {
    const value = this.busquedaTicket.trim().toLowerCase();

    if (!value) return this.tickets.slice(-5).reverse();

    return this.tickets.filter((ticket) =>
      [ticket.numeroCaso, ticket.cliente, ticket.equipo, ticket.estado]
        .join(' ')
        .toLowerCase()
        .includes(value)
    );
  }

  protected abrirFormulario(): void {
    this.ticketErrorMessage = '';
    this.ticketSubmitted = false;
    this.ticketForm = {
      ...this.createEmptyTicketForm(),
      numeroCaso: this.generarNumeroCasoTemporal()
    };
    this.vistaActual = 'crear';
  }

  protected cancelarCreacion(): void {
    this.ticketForm = this.createEmptyTicketForm();
    this.ticketErrorMessage = '';
    this.ticketSubmitted = false;
    this.vistaActual = 'dashboard';
  }

  protected guardarTicket(): void {
    this.ticketSubmitted = true;

    if (!this.isTicketFormValid()) {
      this.ticketErrorMessage = 'Completa los datos requeridos antes de guardar.';
      return;
    }

    if (!this.usuarioTemporalId) {
      this.ticketErrorMessage = 'No hay un usuario disponible para crear el ticket.';
      return;
    }

    this.isSavingTicket = true;
    this.ticketErrorMessage = '';

    const recepcionPayload = {
      numeroCaso: this.ticketForm.numeroCaso,
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
        switchMap((response) =>
          this.ticketsService.createTicket({
            numeroTicket: this.ticketForm.numeroCaso,
            recepcionEquipoId: response.recepcion._id,
            creadoPor: this.usuarioTemporalId,
            prioridad: 'media',
            estadoTicket: 'creado',
          }),
        ),
        finalize(() => {
          this.isSavingTicket = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.ticketSuccessMessage = `Ticket ${response.ticket.numeroTicket} creado con éxito.`;
          this.tickets = [
            ...this.tickets,
            {
              id: response.ticket._id,
              numeroCaso: response.ticket.numeroTicket,
              cliente: response.ticket.nombreCliente,
              telefonoCliente: response.ticket.telefonoCliente || '',
              equipo: response.ticket.tipoEquipo,
              marcaEquipo: response.ticket.marcaEquipo || '',
              modeloEquipo: response.ticket.modeloEquipo || '',
              serieEquipo: response.ticket.serieEquipo || '',
              fallaReportada: response.ticket.fallaReportada || '',
              condicionFisica: response.ticket.condicionFisica || '',
              accesoriosEntregados: response.ticket.accesoriosEntregados || [],
              tecnicoAsignadoId: this.getTechnicianId(response.ticket.tecnicoAsignado),
              tecnicoAsignadoNombre: this.getTechnicianName(response.ticket.tecnicoAsignado),
              estado: this.formatEstado(response.ticket.estadoTicket),
              estadoCodigo: response.ticket.estadoTicket,
              prioridad: response.ticket.prioridad,
              fechaCreacion: response.ticket.fechaCreacion || '',
            },
          ];
          this.isTicketSuccessDialogOpen = true;
        },
        error: (error) => {
          this.ticketErrorMessage =
            error.error?.error || error.message || 'No se pudo crear el ticket.';
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
    this.isTicketDetailDialogOpen = true;
  }

  protected closeTicketDetail(): void {
    this.isTicketDetailDialogOpen = false;
  }

  protected openAssignTechnicianDialog(): void {
    if (!this.selectedTicket) return;

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
    if (!this.selectedTicket) return;

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
    if (!this.selectedTicket) return;

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
    return this.selectedTicket.estadoCodigo !== 'pendiente_aprobacion';
  }

  protected assignTechnician(): void {
    if (!this.selectedTicket) return;

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
            ticket.id === updatedTicket.id ? updatedTicket : ticket
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
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.usuarioTemporalId = users[0]?._id || '';
      },
      error: () => {
        this.usuarioTemporalId = '';
      },
    });
  }

  private loadTickets(): void {
    this.ticketsService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets.map((ticket) => this.mapTicketResponse(ticket));
      },
      error: () => {
        this.tickets = [];
      },
    });
  }

  private loadTechnicians(): void {
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
      estado: this.formatEstado(ticket.estadoTicket),
      estadoCodigo: ticket.estadoTicket,
      prioridad: ticket.prioridad,
      fechaCreacion: ticket.fechaCreacion || '',
    };
  }

  private getTechnicianId(value: TechnicianOption | string | null | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value._id;
  }

  private getTechnicianName(value: TechnicianOption | string | null | undefined): string {
    if (!value || typeof value === 'string') return '';
    return value.nombre_completo || value.username;
  }

  private parseAccesorios(value: string): string[] {
    return value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private formatEstado(value: string): string {
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
      estadoRecepcion: 'registrado'
    };
  }
}
