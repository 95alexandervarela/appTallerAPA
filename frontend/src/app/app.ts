import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Contenedor raiz de la aplicacion Angular.
 *
 * @remarks
 * Aloja el router principal para alternar entre pantallas como `Login` y `Home`.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
