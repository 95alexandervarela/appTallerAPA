import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Pantalla de inicio de sesion para la Mesa de Taller APA.
 *
 * @remarks
 * Esta version es visual y todavia no autentica contra backend. Usa controles
 * PrimeNG para preparar el formulario que luego se conectara con Express y MongoDB.
 */
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  /**
   * Ruta relativa del logo institucional mostrado en la tarjeta de login.
   *
   * @remarks
   * Reemplaza el icono de taller por una imagen servida como asset de Angular.
   * Si `imagenes/iconos/logoAPA.jpg` cambia, la UI tomara la nueva imagen sin
   * modificar el componente.
   */
  protected readonly loginLogoPath = 'imagenes/iconos/logoAPA.jpg';

  /** Nombre de usuario escrito en el formulario de inicio de sesion. */
  protected username = '';

  /**
   * Estado visual del checkbox "Recordar usuario".
   *
   * @remarks
   * Se agrega solo para la UI solicitada; todavia no se conecta con backend,
   * almacenamiento local ni autenticacion.
   */
  protected rememberUser = false;

  /** Contrasena escrita en el formulario de inicio de sesion. */
  protected password = '';
}
