import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

interface UserRow {
  name: string;
  role: string;
  status: string;
  severity: 'success' | 'info' | 'warn';
}

/**
 * Panel simulado para la gestion de usuarios.
 *
 * @remarks
 * Presenta la estructura inicial de la seccion sin conectar todavia logica de
 * backend, manteniendo el boton preparado para el siguiente incremento.
 */
@Component({
  selector: 'app-users-panel',
  imports: [ButtonModule, TagModule],
  templateUrl: './users-panel.component.html',
  styleUrl: './users-panel.component.scss'
})
export class UsersPanelComponent {
  protected readonly users: UserRow[] = [
    { name: 'Owaldo Hernandez', role: 'Administrador', status: 'Activo', severity: 'success' },
    { name: 'Antonio Hernandez', role: 'Administrador', status: 'Revision', severity: 'info' },
    { name: 'Jose Lainez', role: 'Administrador', status: 'Activo', severity: 'success' },
    { name: 'Armando Vasquez', role: 'Tecnico', status: 'Activo', severity: 'success' },
    { name: 'Dagoberto Perez', role: 'Tecnico', status: 'Activo', severity: 'success' }
  ];
}
