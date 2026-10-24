import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ADMIN_USER_ROLES, AdminUserForm, apiErrorMessage } from '../admin-user-form.model';

@Component({
  selector: 'app-admin-user-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-create.component.html',
  styleUrl: '../admin-user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUserCreateComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles = ADMIN_USER_ROLES;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form: AdminUserForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'EDITOR',
    status: 'ACTIVE',
    notificationContact: false,
    password: ''
  };

  submit(): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    const { firstName, lastName, email, role, status, password } = this.form;
    this.api.post<unknown>(API_ROUTES.admin.users, {
      firstName,
      lastName,
      email,
      role,
      status,
      password
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success('Le compte a été créé.');
        void this.router.navigate(['/dashboard/users']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Impossible de créer le compte.'));
      }
    });
  }

  backToUsers(): void {
    void this.router.navigate(['/dashboard/users']);
  }
}
