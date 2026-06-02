import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, map, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { AuthRoleCode, AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';

interface UserRow {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  roleId: string;
  roleCode: string;
  activo: boolean;
  status: string;
  severity: 'success' | 'info' | 'warn';
}

interface CreateUserForm {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
}

interface RoleOption {
  label: string;
  value: string;
  code: string;
}

interface StatusOption {
  label: string;
  value: string;
}

interface EditUserForm {
  userId: string;
  nombre_completo: string;
  email: string;
  role: string;
  status: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Panel para la gestión de usuarios.
 *
 * @remarks
 * Proporciona un modal de creación de usuarios que transforma los datos del formulario
 * al esquema esperado por el backend. Maneja la comunicación con el API para crear usuarios
 * y valida que los datos cumplan con las restricciones del backend.
 */
@Component({
  selector: 'app-users-panel',
  imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, SelectModule, TagModule],
  templateUrl: './users-panel.component.html',
  styleUrl: './users-panel.component.scss',
})
export class UsersPanelComponent implements OnInit {
  protected isCreateUserDialogOpen = false;
  protected isSuccessDialogOpen = false;
  protected isUserInfoDialogOpen = false;
  protected isEditUserDialogOpen = false;
  protected isDeleteUserDialogOpen = false;
  protected isDeleteSuccessDialogOpen = false;
  protected createUserSubmitted = false;
  protected editUserSubmitted = false;
  protected createUserSuccessMessage = '';
  protected createUserErrorMessage = '';
  protected editUserSuccessMessage = '';
  protected editUserErrorMessage = '';
  protected deleteUserErrorMessage = '';
  protected deleteUserSuccessMessage = '';
  protected deletedUserName = '';
  protected isLoadingCreateUser = false;
  protected isLoadingEditUser = false;
  protected isLoadingDeleteUser = false;
  protected isLoadingUsers = false;
  protected usersLoadErrorMessage = '';

  protected roleOptions: RoleOption[] = [];
  protected statusOptions: StatusOption[] = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
  ];
  protected roleLabelMap: Map<string, string> = new Map(); // Mapea rol_id a nombre visible
  protected users: UserRow[] = [];
  protected selectedUser: UserRow | null = null;

  protected createUserForm: CreateUserForm = this.createEmptyUserForm();
  protected editUserForm: EditUserForm = this.createEmptyEditUserForm();

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  private loadRoles(): void {
    this.usersService.getRoles().subscribe({
      next: (roles) => {
        roles.forEach((role) => {
          this.mergeRoleOption({
            label: role.nombre,
            value: role._id,
            code: role.codigo,
          });
        });
      },
      error: () => {
        this.mergeRoleOption({
          label: 'Administrador',
          value: '6a126c9296a6e0cb6e9df8a3',
          code: 'administrador',
        });
        this.mergeRoleOption({
          label: 'Tecnico',
          value: '6a126c9296a6e0cb6e9df8a4',
          code: 'tecnico',
        });
      },
    });
  }

  /**
   * Carga los usuarios activos desde el backend y los transforma al formato de tabla.
   *
   * @remarks
   * Realiza una solicitud GET a la API de usuarios y transforma los datos
   * al formato esperado por la tabla (UserRow).
   */
  private loadUsers(): void {
    this.isLoadingUsers = true;
    this.usersLoadErrorMessage = '';

    this.usersService
      .getUsers()
      .pipe(
        finalize(() => {
          this.isLoadingUsers = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (users: any[]) => {
          this.users = users.map((user) => ({
            id: user._id,
            username: user.username,
            email: user.email,
            name: user.nombre_completo,
            role: user.roleName || this.roleLabelMap.get(user.roleId || user.rol_id) || 'Desconocido',
            roleId: user.roleId || user.rol_id,
            roleCode: user.roleCode || 'desconocido',
            activo: user.activo,
            status: user.activo ? 'Activo' : 'Inactivo',
            severity: user.activo ? 'success' as const : 'warn' as const,
          }))
            .filter((user) => this.canViewUser(user))
            .sort((firstUser, secondUser) =>
              firstUser.name.localeCompare(secondUser.name, 'es', { sensitivity: 'base' }),
            );
          users.forEach((user) => {
            if (user.roleId && user.roleName) {
              this.mergeRoleOption({
                label: user.roleName,
                value: user.roleId,
                code: user.roleCode || 'desconocido',
              });
            }
          });
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.users = [];
          this.usersLoadErrorMessage =
            error.error?.error || error.message || 'No se pudieron cargar los usuarios.';
        },
      });
  }

  protected refreshUsers(): void {
    this.loadUsers();
  }

  protected openUserInfoDialog(user: UserRow): void {
    this.selectedUser = user;
    this.isUserInfoDialogOpen = true;
  }

  protected selectUser(user: UserRow): void {
    this.selectedUser = user;
  }

  protected closeUserInfoDialog(): void {
    this.isUserInfoDialogOpen = false;
  }

  protected openEditUserDialog(): void {
    const user = this.selectedUser || this.users[0];

    if (!user || !this.canEditUser(user)) return;

    this.editUserSubmitted = false;
    this.editUserErrorMessage = '';
    this.editUserSuccessMessage = '';
    this.applyUserToEditForm(user);
    this.isEditUserDialogOpen = true;
  }

  protected closeEditUserDialog(): void {
    this.isEditUserDialogOpen = false;
    this.editUserSubmitted = false;
    this.editUserErrorMessage = '';
    this.editUserSuccessMessage = '';
    this.editUserForm = this.createEmptyEditUserForm();
  }

  protected onEditUserSelected(userId: string): void {
    const user = this.users.find((item) => item.id === userId);

    if (!user) return;

    this.applyUserToEditForm(user);
  }

  protected openDeleteUserDialog(): void {
    if (!this.selectedUser || !this.canDeleteUser(this.selectedUser)) return;

    this.deleteUserErrorMessage = '';
    this.isDeleteUserDialogOpen = true;
  }

  protected closeDeleteUserDialog(): void {
    this.isDeleteUserDialogOpen = false;
    this.deleteUserErrorMessage = '';
  }

  protected openCreateUserDialog(): void {
    this.isCreateUserDialogOpen = true;
    this.createUserSubmitted = false;
    this.createUserSuccessMessage = '';
    this.createUserErrorMessage = '';
  }

  protected closeCreateUserDialog(): void {
    this.isCreateUserDialogOpen = false;
    this.createUserSubmitted = false;
    this.createUserErrorMessage = '';
    this.createUserForm = this.createEmptyUserForm();
  }

  protected closeSuccessDialog(): void {
    this.isSuccessDialogOpen = false;
    this.createUserSuccessMessage = '';
  }

  protected closeDeleteSuccessDialog(): void {
    this.isDeleteSuccessDialogOpen = false;
    this.deleteUserSuccessMessage = '';
    this.deletedUserName = '';
    this.selectedUser = null;
    this.loadUsers();
    this.changeDetectorRef.detectChanges();
  }

  protected saveEditUser(): void {
    if (!this.selectedUser) {
      return;
    }

    this.editUserSubmitted = true;
    this.editUserErrorMessage = '';
    this.editUserSuccessMessage = '';

    if (!this.canEditUser(this.selectedUser)) {
      this.editUserErrorMessage = '⚠️ No tienes permisos para modificar este usuario.';
      return;
    }

    if (!this.isEditUserFormValid()) {
      return;
    }

    if (this.isEditPasswordIncomplete()) {
      this.editUserErrorMessage = '⚠️ Completa la nueva contraseña y su confirmación.';
      return;
    }

    if (this.isEditPasswordMismatch()) {
      this.editUserErrorMessage = '⚠️ Las contraseñas no coinciden.';
      return;
    }

    const payload = {
      nombre_completo: this.editUserForm.nombre_completo.trim(),
      email: this.editUserForm.email.toLowerCase().trim(),
      rol_id: this.editUserForm.role,
      activo: this.editUserForm.status === 'activo',
    };

    if (!payload.rol_id) {
      this.editUserErrorMessage = '⚠️ El rol seleccionado no es válido.';
      return;
    }

    this.isLoadingEditUser = true;
    const shouldChangePassword = this.hasEditPasswordInput();
    const updateUser$ = this.usersService.updateUser(this.editUserForm.userId, payload);
    const saveUser$ = shouldChangePassword
      ? updateUser$.pipe(
          switchMap((response) =>
            this.usersService
              .changePassword(this.editUserForm.userId, {
                newPassword: this.editUserForm.newPassword,
              })
              .pipe(map(() => response)),
          ),
        )
      : updateUser$;

    saveUser$.subscribe({
      next: (response: any) => {
        this.isLoadingEditUser = false;
        const updatedUser = response.user;

        if (updatedUser) {
          this.selectedUser = {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            name: updatedUser.nombre_completo,
            role: updatedUser.roleName || this.roleLabelMap.get(updatedUser.roleId || updatedUser.rol_id) || 'Desconocido',
            roleId: updatedUser.roleId || updatedUser.rol_id,
            roleCode: updatedUser.roleCode || 'desconocido',
            activo: updatedUser.activo,
            status: updatedUser.activo ? 'Activo' : 'Inactivo',
            severity: updatedUser.activo ? 'success' as const : 'warn' as const,
          };
        }

        this.loadUsers();
        if (shouldChangePassword) {
          this.editUserSuccessMessage = 'Contraseña actualizada correctamente';
          this.editUserForm.newPassword = '';
          this.editUserForm.confirmPassword = '';
          return;
        }

        this.closeEditUserDialog();
        this.changeDetectorRef.detectChanges();
      },
      error: (error: any) => {
        this.isLoadingEditUser = false;
        const fallbackError = shouldChangePassword
          ? 'Error al actualizar contraseña'
          : 'Error al editar el usuario. Intenta nuevamente.';
        const errorMsg =
          error.error?.error || error.message || fallbackError;
        this.editUserErrorMessage = `⚠️ ${errorMsg}`;
      },
    });
  }

  protected deleteSelectedUser(): void {
    if (!this.selectedUser) return;

    if (!this.canDeleteUser(this.selectedUser)) {
      this.deleteUserErrorMessage = '⚠️ No tienes permisos para eliminar este usuario.';
      return;
    }

    const userName = this.selectedUser.name;

    this.isLoadingDeleteUser = true;
    this.deleteUserErrorMessage = '';

    this.usersService
      .deleteUser(this.selectedUser.id)
      .pipe(
        finalize(() => {
          this.isLoadingDeleteUser = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
      next: () => {
        this.deletedUserName = userName;
        this.deleteUserSuccessMessage = 'Usuario eliminado con éxito.';
        this.closeDeleteUserDialog();
        this.isDeleteSuccessDialogOpen = true;
      },
      error: (error: any) => {
        if (error.status === 404) {
          this.deletedUserName = userName;
          this.deleteUserSuccessMessage = 'Usuario eliminado con éxito.';
          this.closeDeleteUserDialog();
          this.isDeleteSuccessDialogOpen = true;
          return;
        }

        const errorMsg =
          error.error?.error || error.message || 'Error al eliminar el usuario. Intenta nuevamente.';
        this.deleteUserErrorMessage = `⚠️ ${errorMsg}`;
      },
    });
  }

  protected saveCreateUser(): void {
    this.createUserSubmitted = true;
    this.createUserSuccessMessage = '';
    this.createUserErrorMessage = '';
    this.updateGeneratedUsername();

    if (!this.isCreateUserFormValid()) {
      return;
    }

    this.submitUserToBackend();
  }

  /**
   * Envía el usuario al backend transformando los datos al esquema esperado.
   *
   * @remarks
   * Transforma el formulario frontend al payload esperado por el backend:
   * - Combina firstName + lastName en nombre_completo
   * - Mapea el rol seleccionado a su rol_id
   * - Envía password (no passwordHash)
   */
  private submitUserToBackend(): void {
    const payload = {
      username: this.createUserForm.username.toLowerCase().trim(),
      email: this.createUserForm.email.toLowerCase().trim(),
      nombre_completo: `${this.createUserForm.firstName} ${this.createUserForm.lastName}`.trim(),
      password: this.createUserForm.password,
      rol_id: this.createUserForm.role,
    };

    const duplicateUser = this.users.find(
      (user) => user.username === payload.username || user.email === payload.email,
    );

    if (duplicateUser?.username === payload.username) {
      this.createUserErrorMessage = '⚠️ El nombre de usuario ya está registrado.';
      return;
    }

    if (duplicateUser?.email === payload.email) {
      this.createUserErrorMessage = '⚠️ El correo electrónico ya está registrado.';
      return;
    }

    if (!payload.rol_id) {
      this.createUserErrorMessage = '⚠️ El rol seleccionado no es válido.';
      return;
    }

    this.isLoadingCreateUser = true;

    this.usersService
      .createUser(payload)
      .pipe(
        finalize(() => {
          this.isLoadingCreateUser = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
      next: () => {
        this.createUserSuccessMessage = 'Usuario creado exitosamente.';
        this.loadUsers();
        this.closeCreateUserDialog();
        this.isSuccessDialogOpen = true;
      },
      error: (error: any) => {
        const errorMsg =
          error.error?.error || error.message || 'Error al crear el usuario. Intenta nuevamente.';
        this.createUserErrorMessage = `⚠️ ${errorMsg}`;
      },
    });
  }

  protected isFieldInvalid(field: keyof CreateUserForm): boolean {
    return this.createUserSubmitted && !this.createUserForm[field].trim();
  }

  protected isEmailInvalid(): boolean {
    const email = this.createUserForm.email.trim();

    return this.createUserSubmitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  protected isEditFieldInvalid(field: keyof EditUserForm): boolean {
    return this.editUserSubmitted && !this.editUserForm[field].trim();
  }

  protected isEditEmailInvalid(): boolean {
    const email = this.editUserForm.email.trim();

    return this.editUserSubmitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  protected isEditPasswordMismatch(): boolean {
    return (
      this.editUserSubmitted &&
      !!this.editUserForm.newPassword &&
      !!this.editUserForm.confirmPassword &&
      this.editUserForm.newPassword !== this.editUserForm.confirmPassword
    );
  }

  protected isPasswordMismatch(): boolean {
    return (
      this.createUserSubmitted &&
      !!this.createUserForm.password &&
      !!this.createUserForm.confirmPassword &&
      this.createUserForm.password !== this.createUserForm.confirmPassword
    );
  }

  protected canEditSelectedUser(): boolean {
    return !!this.selectedUser && this.canEditUser(this.selectedUser);
  }

  protected canDeleteSelectedUser(): boolean {
    return !!this.selectedUser && this.canDeleteUser(this.selectedUser);
  }

  protected get availableRoleOptions(): RoleOption[] {
    if (this.currentRole === 'manager') return this.roleOptions;
    if (this.currentRole === 'administrador') {
      return this.roleOptions.filter((role) => role.code === 'tecnico');
    }

    return [];
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
      'email',
      'role',
      'password',
      'confirmPassword',
    ];

    const hasEmptyRequiredField = requiredFields.some(
      (field) => !this.createUserForm[field].trim(),
    );

    return !hasEmptyRequiredField && !this.isEmailInvalid() && !this.isPasswordMismatch();
  }

  private createEmptyUserForm(): CreateUserForm {
    return {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      role: '',
      password: '',
      confirmPassword: '',
    };
  }

  private createEmptyEditUserForm(): EditUserForm {
    return {
      userId: '',
      nombre_completo: '',
      email: '',
      role: '',
      status: 'activo',
      newPassword: '',
      confirmPassword: '',
    };
  }

  private isEditUserFormValid(): boolean {
    const requiredFields: Array<keyof EditUserForm> = [
      'userId',
      'nombre_completo',
      'email',
      'role',
      'status',
    ];
    const hasEmptyRequiredField = requiredFields.some((field) => !this.editUserForm[field].trim());

    return !hasEmptyRequiredField && !this.isEditEmailInvalid();
  }

  private applyUserToEditForm(user: UserRow): void {
    this.selectedUser = user;
    this.editUserForm = {
      userId: user.id,
      nombre_completo: user.name,
      email: user.email,
      role: user.roleId,
      status: user.activo ? 'activo' : 'inactivo',
      newPassword: '',
      confirmPassword: '',
    };
  }

  private hasEditPasswordInput(): boolean {
    return !!this.editUserForm.newPassword || !!this.editUserForm.confirmPassword;
  }

  protected isEditPasswordIncomplete(): boolean {
    return this.hasEditPasswordInput()
      && (!this.editUserForm.newPassword || !this.editUserForm.confirmPassword);
  }

  private mergeRoleOption(role: RoleOption): void {
    if (!role.value) return;

    const existingIndex = this.roleOptions.findIndex((item) => item.value === role.value);

    if (existingIndex >= 0) {
      const existingRole = this.roleOptions[existingIndex];
      this.roleOptions = this.roleOptions.map((item, index) =>
        index === existingIndex
          ? { ...existingRole, code: existingRole.code || role.code }
          : item,
      );
      this.roleLabelMap.set(role.value, role.label);
      return;
    }

    this.roleOptions = [...this.roleOptions, role].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    this.roleLabelMap.set(role.value, role.label);
  }

  private canViewUser(user: UserRow): boolean {
    if (this.currentRole === 'manager') return true;
    if (this.currentRole === 'administrador') return user.roleCode !== 'manager';

    return false;
  }

  private canEditUser(user: UserRow): boolean {
    if (this.currentRole === 'manager') return true;
    if (this.currentRole === 'administrador') return user.roleCode === 'tecnico';

    return false;
  }

  private canDeleteUser(user: UserRow): boolean {
    return this.canEditUser(user);
  }

  private get currentRole(): AuthRoleCode {
    return this.authService.getCurrentRole();
  }

  private normalizeUsername(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }
}
