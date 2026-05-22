import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { CardComponent } from '../../shared/components/card.component';

interface DashboardMetric {
  title: string;
  value: string;
  detail: string;
  icon: string;
}

interface QueueItem {
  label: string;
  value: string;
  progress: number;
}

/**
 * Dashboard Home con estructura operativa inspirada en Zoho Desk.
 *
 * @remarks
 * Usa datos simulados y componentes PrimeNG para representar metricas,
 * placeholders de graficas y widgets. Para escalarlo, reemplazar los arreglos
 * locales por servicios que consuman endpoints del backend.
 */
@Component({
  selector: 'app-home',
  imports: [CardModule, ProgressBarModule, TagModule, CardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected readonly metrics: DashboardMetric[] = [
    {
      title: 'Tickets abiertos',
      value: '120',
      detail: '18 de alta prioridad',
      icon: 'pi pi-inbox'
    },
    {
      title: 'Cerrados',
      value: '45',
      detail: 'Resueltos esta semana',
      icon: 'pi pi-check-circle'
    },
    {
      title: 'Pendientes',
      value: '12',
      detail: 'Esperando revision',
      icon: 'pi pi-clock'
    },
    {
      title: 'SLA en riesgo',
      value: '7',
      detail: 'Vencen hoy',
      icon: 'pi pi-exclamation-triangle'
    }
  ];

  protected readonly queue: QueueItem[] = [
    { label: 'Soporte tecnico', value: '64%', progress: 64 },
    { label: 'Reparaciones', value: '48%', progress: 48 },
    { label: 'Garantias', value: '28%', progress: 28 }
  ];
}
