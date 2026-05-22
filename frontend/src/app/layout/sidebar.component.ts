import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

/**
 * Sidebar vertical inspirado en el patron de navegacion de Zoho Desk.
 *
 * @remarks
 * Usa `MenuModule` de PrimeNG para mantener una navegacion declarativa con
 * icono y texto. Para agregar nuevas vistas, incluir un nuevo `MenuItem` y
 * registrar su ruta hija en `app.routes.ts`.
 */
@Component({
  selector: 'app-sidebar',
  imports: [MenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  protected readonly menuItems: MenuItem[] = [
    {
      label: 'Overview',
      icon: 'pi pi-home',
      routerLink: '/home',
      styleClass: 'active-item'
    },
    {
      label: 'Tickets',
      icon: 'pi pi-inbox'
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-line'
    },
    {
      label: 'Reportes',
      icon: 'pi pi-file'
    },
    {
      label: 'Configuracion',
      icon: 'pi pi-cog pi-spin',
      styleClass: 'settings-item'
    }
  ];
}
