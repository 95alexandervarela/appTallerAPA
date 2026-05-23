import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

interface UserRow {
  name: string;
  role: string;
  status: string;
  severity: 'success' | 'info' | 'warn';
}

interface CreateUserForm {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  password: string;
  confirmPassword: string;
}

/**
 * Panel simulado para la gestion de usuarios.
 *
 * @remarks
 * Agrega un modal interno de creacion dentro de `/config`, sin ruta nueva,
 * porque es un flujo SaaS contextual. Por ahora solo valida UI sin backend.
 */
@Component({
  selector: 'app-users-panel',
  imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, SelectModule, TagModule],
  templateUrl: './users-panel.component.html',
  styleUrl: './users-panel.component.scss'
})
export class UsersPanelComponent {
  protected isCreateUserDialogOpen = false;
  protected createUserSubmitted = false;
  protected createUserSuccessMessage = '';

  protected readonly roleOptions = ['Administrador', 'Tecnico'];
  protected readonly statusOptions = ['Activo', 'Revision'];

  protected createUserForm: CreateUserForm = this.createEmptyUserForm();

  protected readonly users: UserRow[] = [
    { name: 'Owaldo Hernandez', role: 'Administrador', status: 'Activo', severity: 'success' },
    { name: 'Antonio Hernandez', role: 'Administrador', status: 'Revision', severity: 'info' },
    { name: 'Jose Lainez', role: 'Administrador', status: 'Activo', severity: 'success' },
    { name: 'Armando Vasquez', role: 'Tecnico', status: 'Activo', severity: 'success' },
    { name: 'Dagoberto Perez', role: 'Tecnico', status: 'Activo', severity: 'success' }
  ];

  protected openCreateUserDialog(): void {
    this.isCreateUserDialogOpen = true;
    this.createUserSubmitted = false;
    this.createUserSuccessMessage = '';
  }

  protected closeCreateUserDialog(): void {
    this.isCreateUserDialogOpen = false;
    this.createUserSubmitted = false;
    this.createUserSuccessMessage = '';
    this.createUserForm = this.createEmptyUserForm();
  }

  protected saveCreateUser(): void {
    this.createUserSubmitted = true;
    this.createUserSuccessMessage = '';
    this.updateGeneratedUsername();

    if (!this.isCreateUserFormValid()) {
      return;
    }

    this.createUserSuccessMessage = 'Usuario validado correctamente. Pendiente conexion con backend.';
  }

  protected isFieldInvalid(field: keyof CreateUserForm): boolean {
    return this.createUserSubmitted && !this.createUserForm[field].trim();
  }

  protected isEmailInvalid(): boolean {
    const email = this.createUserForm.email.trim();

    return this.createUserSubmitted && !!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  protected isPasswordMismatch(): boolean {
    return (
      this.createUserSubmitted &&
      !!this.createUserForm.password &&
      !!this.createUserForm.confirmPassword &&
      this.createUserForm.password !== this.createUserForm.confirmPassword
    );
  }

  /**
   * Genera el usuario con la primera letra del nombre y el primer apellido.
   *
   * @remarks
   * Se mantiene como UI local del modal, sin persistencia ni llamada al backend.
   */
  protected updateGeneratedUsername(): void {
    const firstLetter = this.createUserForm.firstName.trim().charAt(0);
    const firstLastName = this.createUserForm.lastName.trim().split(/\s+/)[0] ?? '';

    this.createUserForm.username = this.normalizeUsername(`${firstLetter}${firstLastName}`);
  }

  private isCreateUserFormValid(): boolean {
    const requiredFields: Array<keyof CreateUserForm> = [
      'firstName',
      'lastName',
      'username',
      'role',
      'status',
      'password',
      'confirmPassword'
    ];

    const hasEmptyRequiredField = requiredFields.some((field) => !this.createUserForm[field].trim());

    return !hasEmptyRequiredField && !this.isEmailInvalid() && !this.isPasswordMismatch();
  }

  private createEmptyUserForm(): CreateUserForm {
    return {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      role: '',
      status: '',
      password: '',
      confirmPassword: ''
    };
  }

  private normalizeUsername(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }
}
