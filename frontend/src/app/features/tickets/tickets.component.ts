import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { RecepcionEquipoService } from '../../core/services/recepcion-equipo.service';
import { TicketsService } from '../../core/services/tickets.service';
import { UsersService } from '../../core/services/users.service';

interface SelectOption {
  label: string;
  value: string;
}

interface TicketResumen {
  numeroCaso: string;
  cliente: string;
  equipo: string;
  estado: string;
  prioridad: string;
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
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss'
})
export class TicketsComponent implements OnInit {
  protected vistaActual: 'dashboard' | 'crear' = 'dashboard';
  protected busquedaTicket = '';
  protected isSavingTicket = false;
  protected ticketErrorMessage = '';
  private usuarioTemporalId = '';

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

  protected ticketForm: TicketForm = this.createEmptyTicketForm();

  constructor(
    private recepcionEquipoService: RecepcionEquipoService,
    private ticketsService: TicketsService,
    private usersService: UsersService,
  ) {}

  ngOnInit(): void {
    this.loadUsuarioTemporal();
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
    this.ticketForm = {
      ...this.createEmptyTicketForm(),
      numeroCaso: this.generarNumeroCasoTemporal()
    };
    this.vistaActual = 'crear';
  }

  protected cancelarCreacion(): void {
    this.ticketForm = this.createEmptyTicketForm();
    this.ticketErrorMessage = '';
    this.vistaActual = 'dashboard';
  }

  protected guardarTicket(): void {
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
          this.tickets = [
            ...this.tickets,
            {
              numeroCaso: response.ticket.numeroTicket,
              cliente: response.ticket.nombreCliente,
              equipo: response.ticket.tipoEquipo,
              estado: this.formatEstado(response.ticket.estadoTicket),
              prioridad: response.ticket.prioridad,
            },
          ];
          this.cancelarCreacion();
        },
        error: (error) => {
          this.ticketErrorMessage =
            error.error?.error || error.message || 'No se pudo crear el ticket.';
        },
      });
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
        this.tickets = tickets.map((ticket) => ({
          numeroCaso: ticket.numeroTicket,
          cliente: ticket.nombreCliente,
          equipo: ticket.tipoEquipo,
          estado: this.formatEstado(ticket.estadoTicket),
          prioridad: ticket.prioridad,
        }));
      },
      error: () => {
        this.tickets = [];
      },
    });
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
