import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { Subscription, interval } from 'rxjs';
import { AuthService, AuthUser } from '../core/services/auth.service';
import { NotificationsService, TicketNotification } from '../core/services/notifications.service';

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
export class SidebarComponent implements OnInit, OnDestroy {
  protected isUserPopoverOpen = false;
  protected isNotificationsPopoverOpen = false;
  protected unreadNotifications = 0;
  protected notifications: TicketNotification[] = [];
  protected isLoadingNotifications = false;

  private readonly subscriptions = new Subscription();

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
    private notificationsService: NotificationsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadNotificationSummary();
    this.subscriptions.add(interval(30000).subscribe(() => this.loadNotificationSummary()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  protected get currentUser(): AuthUser | null {
    return this.authService.getCurrentUser();
  }

  protected get canUseNotifications(): boolean {
    return !!this.currentUser;
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
    this.isNotificationsPopoverOpen = false;
    this.isUserPopoverOpen = !this.isUserPopoverOpen;
  }

  protected toggleNotificationsPopover(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canUseNotifications) return;

    this.isUserPopoverOpen = false;
    this.isNotificationsPopoverOpen = !this.isNotificationsPopoverOpen;

    if (this.isNotificationsPopoverOpen) {
      this.loadNotifications();
    }
  }

  protected stopUserPopoverClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected stopNotificationsPopoverClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected markAllNotificationsAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.unreadNotifications = 0;
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt || new Date().toISOString(),
        }));
      },
    });
  }

  protected formatNotificationDate(value: string): string {
    return new Intl.DateTimeFormat('es-HN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected logout(): void {
    this.isUserPopoverOpen = false;
    this.isNotificationsPopoverOpen = false;
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click')
  protected closeUserPopover(): void {
    this.isUserPopoverOpen = false;
    this.isNotificationsPopoverOpen = false;
  }

  private loadNotificationSummary(): void {
    if (!this.canUseNotifications) {
      this.unreadNotifications = 0;
      this.notifications = [];
      return;
    }

    this.notificationsService.getUnreadCount().subscribe({
      next: ({ count }) => {
        this.unreadNotifications = count;
      },
    });
  }

  private loadNotifications(): void {
    this.isLoadingNotifications = true;
    this.notificationsService.getNotifications(8).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoadingNotifications = false;
        this.loadNotificationSummary();
      },
      error: () => {
        this.notifications = [];
        this.isLoadingNotifications = false;
      },
    });
  }
}
