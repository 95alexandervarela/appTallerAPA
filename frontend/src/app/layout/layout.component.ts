import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

/**
 * Layout principal tipo Zoho Desk para las pantallas internas.
 *
 * @remarks
 * Mantiene un sidebar fijo a la izquierda y un area de contenido a la derecha.
 * El fondo y las superficies usan la misma estetica glass del login para que
 * el dashboard se perciba como una evolucion visual del inicio de sesion.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {}
