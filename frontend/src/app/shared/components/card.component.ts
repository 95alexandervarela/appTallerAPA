import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';

/**
 * Card glass reutilizable para metricas del dashboard.
 *
 * @remarks
 * Envuelve `CardModule` de PrimeNG para mantener una superficie consistente.
 * Se puede extender con nuevos `@Input()` cuando el dashboard necesite estados,
 * acciones o enlaces a vistas de detalle.
 */
@Component({
  selector: 'app-dashboard-card',
  imports: [CardModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) value = '';
  @Input() detail = '';
  @Input() icon = 'pi pi-chart-bar';
}
