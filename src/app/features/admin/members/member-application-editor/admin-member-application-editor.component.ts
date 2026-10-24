import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface AppForm {
  companyName: string;
  representativeName: string;
  representativeEmail: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-admin-member-application-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-member-application-editor.component.html',
  styleUrl: './admin-member-application-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMemberApplicationEditorComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);
  private readonly destroy = inject(DestroyRef);

  readonly form = signal<AppForm>({ companyName: '', representativeName: '', representativeEmail: '', description: '', status: '' });
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly id = signal<string>('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.load(id);
    }
  }

  private load(id: string): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.api.get(`${API_ROUTES.admin.memberApplications}/${id}`).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        let data = res?.data ?? res ?? {};
        if (Array.isArray(data)) data = data[0] ?? {};
        if (Array.isArray(res?.items)) data = res.items[0] ?? data;
        this.form.set({
          companyName: String(data.companyName ?? ''),
          representativeName: String(data.representativeName ?? ''),
          representativeEmail: String(data.representativeEmail ?? ''),
          description: String(data.description ?? ''),
          status: String(data.status ?? 'PENDING')
        });
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Impossible de charger la demande.');
        this.notification.error('Impossible de charger la demande.');
      }
    });
  }

  cancel(): void { this.router.navigate(['/dashboard/members/applications']); }

  submit(): void {
    this.saving.set(true);
    this.errorMsg.set('');
    const payload = { ...this.form() };
    this.api.put(`${API_ROUTES.admin.memberApplications}/${this.id()}/status`, payload).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success('Demande mise à jour.');
        this.cancel();
      },
      error: () => {
        this.saving.set(false);
        this.errorMsg.set('Erreur lors de la mise à jour.');
        this.notification.error('Erreur lors de la mise à jour.');
      }
    });
  }
}
