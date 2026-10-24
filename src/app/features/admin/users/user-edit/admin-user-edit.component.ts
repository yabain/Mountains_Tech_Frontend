import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ADMIN_USER_ROLES, AdminUserForm, apiErrorMessage, asRecord } from '../admin-user-form.model';

@Component({
  selector: 'app-admin-user-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-edit.component.html',
  styleUrl: '../admin-user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUserEditComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles = ADMIN_USER_ROLES;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form: AdminUserForm = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'EDITOR',
    status: 'ACTIVE',
    password: ''
  };

  private readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    if (!this.userId) {
      this.loading.set(false);
      this.error.set('Identifiant de compte manquant.');
      return;
    }

    this.api.get<unknown>(`${API_ROUTES.admin.users}/${encodeURIComponent(this.userId)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const record = this.responseUser(response);
          if (!record) {
            this.error.set('Les informations du compte sont indisponibles.');
            this.loading.set(false);
            return;
          }
          this.populateForm(record);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(apiErrorMessage(error, 'Impossible de charger ce compte.'));
          this.loading.set(false);
        }
      });
  }

  submit(): void {
    if (this.saving() || this.loading() || !this.userId) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    const { firstName, lastName, role, status, password } = this.form;
    const payload: Record<string, unknown> = {
      firstName,
      lastName,
      role,
      status
    };
    if (password.trim()) {
      payload['password'] = password;
    }

    this.api.patch<unknown>(`${API_ROUTES.admin.users}/${encodeURIComponent(this.userId)}`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notification.success('Le compte a été mis à jour.');
          void this.router.navigate(['/dashboard/users']);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(apiErrorMessage(error, 'Impossible de mettre à jour le compte.'));
        }
      });
  }

  backToUsers(): void {
    void this.router.navigate(['/dashboard/users']);
  }

  private responseUser(response: unknown): Record<string, unknown> | null {
    const outer = asRecord(response);
    const data = asRecord(outer?.['data']) ?? outer;
    const user = asRecord(data?.['user']) ?? data;
    return user && ['id', '_id', 'email', 'firstName', 'lastName'].some((key) => key in user)
      ? user
      : null;
  }

  private populateForm(user: Record<string, unknown>): void {
    this.form.firstName = String(user['firstName'] ?? '');
    this.form.lastName = String(user['lastName'] ?? '');
    this.form.email = String(user['email'] ?? '');
    this.form.role = String(user['role'] ?? 'EDITOR').toUpperCase();
    const status = String(user['status'] ?? '').toUpperCase();
    this.form.status = ['ACTIVE', 'ACTIF', 'TRUE'].includes(status) || user['isActive'] === true
      ? 'ACTIVE'
      : 'INACTIVE';
    this.form.password = '';
  }
}
