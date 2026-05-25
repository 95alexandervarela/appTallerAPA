import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../core/services/auth.service';

/**
 * Pantalla de inicio de sesion para la Mesa de Taller APA.
 *
 * @remarks
 * Conecta el formulario visual existente con el backend real sin modificar la
 * estetica del login. La sesion temporal guarda solo datos minimos del usuario.
 */
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
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

  protected isLoggingIn = false;
  protected loginErrorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Ejecuta el login real contra backend y navega solo si las credenciales son validas.
   *
   * @remarks
   * No guarda contrasenas ni valida permisos en frontend; backend verifica el
   * hash y devuelve el rol minimo para activar la experiencia del usuario.
   */
  protected submitLogin(): void {
    this.loginErrorMessage = '';

    if (!this.username.trim() || !this.password) {
      this.loginErrorMessage = 'Ingresa usuario y contrasena.';
      return;
    }

    this.isLoggingIn = true;

    this.authService
      .login(this.username, this.password)
      .pipe(
        finalize(() => {
          this.isLoggingIn = false;
        }),
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/home');
        },
        error: (error) => {
          this.loginErrorMessage =
            error.error?.error ||
            error.message ||
            'No se pudo iniciar sesion. Revisa el backend e intenta nuevamente.';
        },
      });
  }
}
