import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfigOption } from './config.types';

/**
 * Submenu interno para navegar entre secciones de configuracion.
 *
 * @remarks
 * Mantiene la navegacion local de la vista sin modificar el sidebar global.
 */
@Component({
  selector: 'app-config-menu',
  templateUrl: './config-menu.component.html',
  styleUrl: './config-menu.component.scss'
})
export class ConfigMenuComponent {
  @Input({ required: true }) options: ConfigOption[] = [];
  @Input({ required: true }) selectedKey = '';
  @Output() readonly selectedKeyChange = new EventEmitter<string>();
}
