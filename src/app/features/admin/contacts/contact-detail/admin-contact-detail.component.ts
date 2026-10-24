import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DashboardDataService } from '../../dashboard/dashboard-data.service';

type ContactRecord = Record<string, unknown>;

@Component({
  selector: 'app-admin-contact-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-contact-detail.component.html',
  styleUrl: '../../resource/admin-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminContactDetailComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly dashboardData = inject(DashboardDataService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly contact = signal<ContactRecord | null>(null);
  readonly contactId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    if (!this.contactId) {
      this.error.set('Identifiant du message manquant.');
      this.loading.set(false);
      return;
    }
    this.load();
  }

  get status(): string {
    return String(this.contact()?.['status'] ?? '').toUpperCase();
  }

  get isUnread(): boolean {
    return this.status === 'NEW' || this.status === 'IN_PROGRESS';
  }

  get canToggleRead(): boolean {
    return this.status !== 'SPAM';
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      NEW: 'Nouveau',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
      SPAM: 'Indésirable'
    };
    return labels[this.status] ?? '—';
  }

  markReadState(): void {
    if (this.busy() || !this.contactId || !this.canToggleRead) return;
    const status = this.isUnread ? 'RESOLVED' : 'IN_PROGRESS';
    this.busy.set(true);
    this.api.patch<unknown>(`${API_ROUTES.admin.contacts}/${encodeURIComponent(this.contactId)}/status`, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const updated = this.unwrap(response);
          this.contact.update((current) => ({ ...(current ?? {}), ...(updated ?? {}), status }));
          this.busy.set(false);
          this.notification.success(status === 'IN_PROGRESS' ? 'Message marqué comme non lu.' : 'Message marqué comme lu.');
        },
        error: () => {
          this.busy.set(false);
          this.error.set('Impossible de modifier le statut du message.');
        }
      });
  }

  deleteContact(): void {
    if (this.busy() || !this.contactId) return;
    if (!confirm('Supprimer définitivement ce message ?')) return;
    this.busy.set(true);
    this.api.delete<unknown>(`${API_ROUTES.admin.contacts}/${encodeURIComponent(this.contactId)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notification.success('Le message a été supprimé.');
          void this.router.navigate(['/dashboard/contacts']);
        },
        error: () => {
          this.busy.set(false);
          this.error.set('Impossible de supprimer ce message.');
        }
      });
  }

  back(): void {
    void this.router.navigate(['/dashboard/contacts']);
  }

  formatDate(value: unknown): string {
    if (!value) return '—';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  }

  initials(value: unknown): string {
    return String(value ?? 'M').trim().slice(0, 1).toUpperCase() || 'M';
  }

  private load(): void {
    this.api.get<unknown>(`${API_ROUTES.admin.contacts}/${encodeURIComponent(this.contactId)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const record = this.unwrap(response);
          if (!record) {
            this.error.set('Ce message est introuvable.');
          } else {
            this.contact.set(record);
            this.dashboardData.markResourceSeen('contacts', this.contactId);
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger ce message.');
          this.loading.set(false);
        }
      });
  }

  private unwrap(response: unknown): ContactRecord | null {
    if (!response || typeof response !== 'object') return null;
    const outer = response as ContactRecord;
    const data = outer['data'] && typeof outer['data'] === 'object'
      ? outer['data'] as ContactRecord
      : outer;
    const item = data['contact'] && typeof data['contact'] === 'object'
      ? data['contact'] as ContactRecord
      : data;
    return ('id' in item || '_id' in item || 'message' in item) ? item : null;
  }
}
