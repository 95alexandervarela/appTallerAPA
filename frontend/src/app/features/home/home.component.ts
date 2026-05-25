import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { CardComponent } from '../../shared/components/card.component';
import { TicketsService } from '../../core/services/tickets.service';
import { AuthService } from '../../core/services/auth.service';

interface DashboardMetric {
  title: string;
  value: string;
  detail: string;
  icon: string;
  statusFilter?: 'pendiente' | 'diagnostico' | 'reparacion';
  navigatesToTickets?: boolean;
}

interface QueueItem {
  label: string;
  value: string;
  progress: number;
}

interface RecentTicket {
  id: string;
  title: string;
  status: string;
  severity: 'success' | 'info' | 'warn' | 'danger';
}

interface ChartBar {
  label: string;
  height: number;
}

/**
 * Dashboard Home con estructura operativa inspirada en Zoho Desk.
 *
 * @remarks
 * Carga datos reales desde la API de tickets y calcula metricas
 * en tiempo real basadas en el estado de los tickets.
 */
@Component({
  selector: 'app-home',
  imports: [CardModule, ProgressBarModule, TagModule, CardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  protected metrics: DashboardMetric[] = [];
  protected queue: QueueItem[] = [];
  protected recentTickets: RecentTicket[] = [];
  protected chartBars: ChartBar[] = [];
  protected activeTechnicians = 0;
  protected avgResponseTime = '0 min';
  protected weeklyCompliance = '0%';

  constructor(
    private ticketsService: TicketsService,
    private authService: AuthService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.initializeEmptyMetrics();
  }

  ngOnInit(): void {
    this.initializeEmptyMetrics();
    this.loadDashboardData();
  }

  private initializeEmptyMetrics(): void {
    if (this.authService.isTecnico()) {
      this.metrics = [
        {
          title: 'Mis tickets',
          value: '0',
          detail: 'Asignados a mi usuario',
          icon: 'pi pi-inbox',
          navigatesToTickets: true,
        },
        {
          title: 'Pendientes',
          value: '0',
          detail: 'Por atender',
          icon: 'pi pi-clock',
          statusFilter: 'pendiente',
          navigatesToTickets: true,
        },
        {
          title: 'Diagnostico',
          value: '0',
          detail: 'En revision tecnica',
          icon: 'pi pi-wrench',
          statusFilter: 'diagnostico',
          navigatesToTickets: true,
        },
        {
          title: 'Reparacion',
          value: '0',
          detail: 'En proceso tecnico',
          icon: 'pi pi-cog',
          statusFilter: 'reparacion',
          navigatesToTickets: true,
        },
      ];
      return;
    }

    this.metrics = [
      { title: 'Tickets abiertos', value: '0', detail: 'de alta prioridad', icon: 'pi pi-inbox' },
      {
        title: 'Cerrados',
        value: '0',
        detail: 'Resueltos esta semana',
        icon: 'pi pi-check-circle',
      },
      { title: 'Pendientes', value: '0', detail: 'Esperando revision', icon: 'pi pi-clock' },
      {
        title: 'SLA en riesgo',
        value: '0',
        detail: 'Vencen hoy',
        icon: 'pi pi-exclamation-triangle',
      },
    ];
  }

  private loadDashboardData(): void {
    this.ticketsService.getTicketsForCurrentUser().subscribe({
      next: (tickets: any[]) => {
        this.procesarTickets(tickets);
        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando tickets:', err);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private procesarTickets(tickets: any[]): void {
    const safeTickets = tickets || [];

    /**
     * Para Tecnico los tickets ya vienen filtrados desde backend por usuario.
     * Aqui solo se calculan metricas propias sin exponer estadistica global.
     */
    if (this.authService.isTecnico()) {
      const pendientesTecnico = safeTickets.filter((t) =>
        ['asignado', 'pendiente_aprobacion', 'pendiente_repuesto', 'espera_repuesto'].includes(
          t.estadoTicket,
        ),
      ).length;
      const diagnostico = safeTickets.filter((t) =>
        ['en_diagnostico', 'diagnostico', 'diagnosticado'].includes(t.estadoTicket),
      ).length;
      const reparacion = safeTickets.filter((t) =>
        ['listo_para_reparacion', 'en_reparacion', 'reparado_servicio_finalizado'].includes(
          t.estadoTicket,
        ),
      ).length;

      this.metrics[0].value = safeTickets.length.toString();
      this.metrics[1].value = pendientesTecnico.toString();
      this.metrics[2].value = diagnostico.toString();
      this.metrics[3].value = reparacion.toString();
    } else {
      const abiertos = safeTickets.filter((t) => !['cerrado', 'cancelado', 'entregado'].includes(t.estadoTicket)).length;
      const cerrados = safeTickets.filter((t) => ['cerrado', 'entregado'].includes(t.estadoTicket)).length;
      const pendientes = safeTickets.filter((t) => t.estadoTicket?.startsWith('pendiente')).length;

      const altaPrioridad = safeTickets.filter((t) => t.prioridad === 'alta' || t.prioridad === 'urgente').length;

      this.metrics[0].value = abiertos.toString();
      this.metrics[0].detail = `${altaPrioridad} de alta prioridad`;
      this.metrics[1].value = cerrados.toString();
      this.metrics[2].value = pendientes.toString();
      this.metrics[3].value = '0'; // SLA en riesgo (requeriria fechas de vencimiento)
    }

    // Calcular colas de trabajo (porcentaje por tipo)
    this.calcularColas(safeTickets);

    // Obtener últimos 3 tickets
    this.recentTickets = safeTickets
      .slice(-3)
      .reverse()
      .map((t) => ({
        id: t.numeroTicket,
        title: t.tipoEquipo || 'Equipo',
        status: t.estadoTicket,
        severity: this.getSeverityFromStatus(t.estadoTicket),
      }));

    // Resumen operativo simulado
    this.activeTechnicians = safeTickets.filter((t) => t.tecnicoAsignado).length;
    this.avgResponseTime = '38 min';
    this.weeklyCompliance = '92%';

    // Generar datos para el gráfico
    this.generarGrafico(safeTickets);
  }

  protected isMetricNavigable(metric: DashboardMetric): boolean {
    return !!metric.navigatesToTickets;
  }

  /**
   * Navega a Tickets reutilizando la misma pantalla con filtros por query param.
   *
   * @param metric Metrica clickeada desde Overview.
   */
  protected navigateToTickets(metric: DashboardMetric): void {
    if (!this.isMetricNavigable(metric)) return;

    this.router.navigate(['/tickets'], {
      queryParams: metric.statusFilter ? { status: metric.statusFilter } : {},
    });
  }

  private generarGrafico(tickets: any[]): void {
    if (!tickets || tickets.length === 0) {
      this.chartBars = [];
      return;
    }

    // Contar tickets por estado
    const countByStatus: { [key: string]: number } = {};
    tickets.forEach((t) => {
      const status = t.estadoTicket || 'Desconocido';
      countByStatus[status] = (countByStatus[status] || 0) + 1;
    });

    // Encontrar el máximo para normalizar las alturas
    const maxCount = Math.max(...Object.values(countByStatus), 1);

    // Generar barras (altura de 20% a 100% basada en proporción)
    this.chartBars = Object.entries(countByStatus).map(([status, count]) => ({
      label: status,
      height: Math.round((count / maxCount) * 100),
    }));
  }

  private calcularColas(tickets: any[]): void {
    const total = tickets.length;
    if (total === 0) {
      this.queue = [
        { label: 'Soporte tecnico', value: '0%', progress: 0 },
        { label: 'Reparaciones', value: '0%', progress: 0 },
        { label: 'Garantias', value: '0%', progress: 0 },
      ];
      return;
    }

    // Contar por tipo de equipo (simulado como colas)
    const countByType: { [key: string]: number } = {};
    tickets.forEach((t) => {
      const tipo = t.tipoEquipo || 'Otros';
      countByType[tipo] = (countByType[tipo] || 0) + 1;
    });

    // Calcular porcentajes
    const tipos = Object.keys(countByType);
    if (tipos.length > 0) {
      this.queue = tipos.slice(0, 3).map((tipo) => {
        const count = countByType[tipo];
        const percentage = Math.round((count / total) * 100);
        return {
          label: tipo,
          value: `${percentage}%`,
          progress: percentage,
        };
      });
    } else {
      this.queue = [
        { label: 'Soporte tecnico', value: '0%', progress: 0 },
        { label: 'Reparaciones', value: '0%', progress: 0 },
        { label: 'Garantias', value: '0%', progress: 0 },
      ];
    }
  }

  private getSeverityFromStatus(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'cerrado':
      case 'entregado':
        return 'success';
      case 'en_reparacion':
      case 'en_diagnostico':
        return 'info';
      case 'pendiente_aprobacion':
      case 'pendiente_repuesto':
        return 'danger';
      default:
        return 'warn';
    }
  }
}
