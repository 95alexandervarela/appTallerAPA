import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import {
  DashboardOverview,
  DashboardRecentActivity,
  DashboardService,
  DashboardStatusCount,
} from '../../core/services/dashboard.service';

interface KpiCard {
  label: string;
  value: number;
  icon: string;
  tone: 'blue' | 'purple' | 'red' | 'slate';
  detail: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected overview: DashboardOverview | null = null;
  protected isLoading = true;
  protected isRefreshing = false;
  protected errorMessage = '';

  private readonly subscriptions = new Subscription();

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.subscriptions.add(interval(60000).subscribe(() => this.loadOverview(true)));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  protected get kpiCards(): KpiCard[] {
    const data = this.overview;

    return [
      {
        label: 'Total tickets',
        value: data?.totalTickets ?? 0,
        icon: 'pi pi-inbox',
        tone: 'blue',
        detail: data?.scope === 'assigned' ? 'Asignados a mi usuario' : 'Vista global',
      },
      {
        label: 'Mis tickets',
        value: data?.misTickets ?? 0,
        icon: 'pi pi-user',
        tone: 'purple',
        detail: 'Creados o asignados',
      },
      {
        label: 'Urgentes',
        value: data?.urgentes ?? 0,
        icon: 'pi pi-exclamation-triangle',
        tone: 'red',
        detail: 'Alta prioridad pendientes',
      },
      {
        label: 'Cerrados',
        value: data?.cerrados ?? 0,
        icon: 'pi pi-check-circle',
        tone: 'slate',
        detail: 'Estados finales',
      },
    ];
  }

  protected get statusCards(): DashboardStatusCount[] {
    return this.overview?.ticketsPorEstado ?? [];
  }

  protected get recentActivity(): DashboardRecentActivity[] {
    return this.overview?.recientes ?? [];
  }

  protected get lastRefreshLabel(): string {
    if (!this.overview?.generatedAt) return 'Sin actualizar';

    return new Intl.DateTimeFormat('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(this.overview.generatedAt));
  }

  protected refresh(): void {
    this.loadOverview(true);
  }

  protected openTickets(): void {
    this.router.navigate(['/tickets']);
  }

  private loadOverview(silent = false): void {
    if (silent) {
      this.isRefreshing = true;
    } else {
      this.isLoading = true;
    }

    this.errorMessage = '';
    this.dashboardService.getOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.isLoading = false;
        this.isRefreshing = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'No se pudo cargar el dashboard';
        this.isLoading = false;
        this.isRefreshing = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }
}
