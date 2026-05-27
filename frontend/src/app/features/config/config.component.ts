import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ConfigMenuComponent } from './config-menu.component';
import { ConfigOption } from './config.types';
import { TicketStatusPanelComponent } from './ticket-status-panel.component';
import { UsersPanelComponent } from './users-panel.component';

/**
 * Vista principal de configuracion del sistema.
 *
 * @remarks
 * Se renderiza dentro de `LayoutComponent`, por eso conserva el sidebar global
 * y solo organiza el contenido derecho en submenu interno y panel activo.
 */
@Component({
  selector: 'app-config',
  imports: [ConfigMenuComponent, TagModule, UsersPanelComponent, TicketStatusPanelComponent],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss'
})
export class ConfigComponent implements OnInit {
  protected readonly options: ConfigOption[] = [
    { key: 'perfil', label: 'Perfil', icon: 'pi pi-id-card' },
    { key: 'cuenta', label: 'Cuenta', icon: 'pi pi-shield' },
    { key: 'apariencia', label: 'Apariencia', icon: 'pi pi-palette' },
    { key: 'accesibilidad', label: 'Accesibilidad', icon: 'pi pi-eye' },
    { key: 'notificaciones', label: 'Notificaciones', icon: 'pi pi-bell' },
    { key: 'usuarios', label: 'Usuarios', icon: 'pi pi-users' },
    { key: 'estados', label: 'Estados', icon: 'pi pi-flag' }
  ];

  protected selectedKey = 'usuarios';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((segments) => {
      const section = segments[0]?.path || 'usuarios';
      this.selectedKey = this.options.some((option) => option.key === section)
        ? section
        : 'usuarios';
    });
  }

  protected get selectedOption(): ConfigOption {
    return this.options.find((option) => option.key === this.selectedKey) ?? this.options[0];
  }

  protected selectOption(key: string): void {
    this.router.navigate(['/config', key]);
  }
}
