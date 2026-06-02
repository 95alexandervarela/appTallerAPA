import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AuthService, AuthUser } from '../core/services/auth.service';

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
  protected isUserPopoverOpen = false;

  private readonly allMenuItems: MenuItem[] = [
    {
      label: 'Overview',
      icon: 'pi pi-home',
      routerLink: '/home',
      styleClass: 'active-item'
    },
    {
      label: 'Recepcion de equipo',
      icon: 'pi pi-desktop',
      routerLink: '/recepcion-equipo'
    },
    {
      label: 'Tickets',
      icon: 'pi pi-inbox',
      routerLink: '/tickets'
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-line',
      routerLink: '/dashboard'
    },
    {
      label: 'Reportes',
      icon: 'pi pi-file'
    },
    {
      label: 'Configuracion',
      icon: 'pi pi-cog pi-spin',
      routerLink: '/config',
      styleClass: 'settings-item'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  protected get currentUser(): AuthUser | null {
    return this.authService.getCurrentUser();
  }

  /**
   * Filtra opciones visibles segun el rol autenticado.
   *
   * @remarks
   * Para Tecnico se ocultan accesos administrativos o de recepcion sin cambiar
   * el layout ni los estilos del sidebar existente.
   */
  protected get menuItems(): MenuItem[] {
    if (!this.authService.isTecnico()) {
      return this.allMenuItems;
    }

    return this.allMenuItems.filter(
      (item) =>
        item.label !== 'Recepcion de equipo' &&
        item.label !== 'Reportes' &&
        item.label !== 'Configuracion',
    );
  }

  /**
   * Se agrego popover de usuario con informacion y logout sin afectar layout del sidebar.
   *
   * @param event Click sobre la burbuja inferior del usuario.
   */
  protected toggleUserPopover(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserPopoverOpen = !this.isUserPopoverOpen;
  }

  protected stopUserPopoverClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected logout(): void {
    this.isUserPopoverOpen = false;
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click')
  protected closeUserPopover(): void {
    this.isUserPopoverOpen = false;
  }
}
