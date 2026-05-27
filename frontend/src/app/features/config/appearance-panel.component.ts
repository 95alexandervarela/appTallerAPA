import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { IconService, ProfileIconOption } from '../../core/services/icon.service';

const SELECTED_ICON_KEY = 'helpDeskTallerAPA.selectedProfileIcon';

/**
 * Panel de Apariencia para seleccionar icono de perfil/sistema.
 *
 * @remarks
 * Carga los iconos locales del directorio de assets en cada apertura de la
 * sección para reflejar cambios en desarrollo sin recargar todo el app shell.
 */
@Component({
  selector: 'app-appearance-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './appearance-panel.component.html',
  styleUrl: './appearance-panel.component.scss',
})
export class AppearancePanelComponent implements OnInit {
  protected icons: ProfileIconOption[] = [];
  protected selectedIconUrl = localStorage.getItem(SELECTED_ICON_KEY) || '';
  protected isLoading = false;
  protected errorMessage = '';

  constructor(
    private iconService: IconService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadIcons();
  }

  protected loadIcons(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.iconService.getProfileIcons().subscribe({
      next: (icons) => {
        this.icons = icons;
        if (!this.selectedIconUrl && icons.length) {
          this.selectedIconUrl = icons[0].url;
          this.persistSelectedIcon(icons[0].url);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.icons = [];
        this.errorMessage = 'No hay iconos disponibles';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  protected selectIcon(icon: ProfileIconOption): void {
    this.selectedIconUrl = icon.url;
    this.iconService.setSelectedIconUrl(icon.url);
  }

  protected isSelected(icon: ProfileIconOption): boolean {
    return this.selectedIconUrl === icon.url;
  }

  protected trackByIcon(_index: number, icon: ProfileIconOption): string {
    return icon.url;
  }

}
