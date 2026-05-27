import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

export interface ProfileIconOption {
  url: string;
  name: string;
}

/**
 * Servicio para listar iconos locales de perfil desde assets.
 *
 * @remarks
 * No usa rutas externas ni cache agresiva. Relee el mapa al abrir la vista para
 * que en desarrollo la lista refleje los archivos actuales del directorio.
 */
@Injectable({
  providedIn: 'root',
})
export class IconService {
  private readonly selectedIconSubject = new BehaviorSubject<string>(
    localStorage.getItem('helpDeskTallerAPA.selectedProfileIcon') || '',
  );

  readonly selectedIcon$ = this.selectedIconSubject.asObservable();

  getProfileIcons(): Observable<ProfileIconOption[]> {
    const modules = import.meta.glob('../../../../imagenes/iconosPerfil/*.{png,jpg,jpeg,svg,webp}', {
      eager: true,
      import: 'default',
    }) as Record<string, string>;

    const icons = Object.entries(modules)
      .map(([path, url]) => ({
        url,
        name: this.formatName(path),
      }))
      .sort((firstIcon, secondIcon) => firstIcon.name.localeCompare(secondIcon.name));

    return of(icons);
  }

  getSelectedIconUrl(): string {
    return this.selectedIconSubject.value;
  }

  setSelectedIconUrl(url: string): void {
    localStorage.setItem('helpDeskTallerAPA.selectedProfileIcon', url);
    this.selectedIconSubject.next(url);
  }

  private formatName(path: string): string {
    const fileName = path.split('/').pop() || 'icono';
    return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  }
}
