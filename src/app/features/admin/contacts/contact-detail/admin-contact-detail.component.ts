import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

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

  get isUnread(): boolean {
    return String(this.contact()?.['status'] ?? '').toUpperCase() === 'NEW';
  }

  markReadState(): void {
    if (this.busy() || !this.contactId) return;
    const status = this.isUnread ? 'IN_PROGRESS' : 'NEW';
    this.busy.set(true);
    this.api.patch<unknown>(`${API_ROUTES.admin.contacts}/${encodeURIComponent(this.contactId)}/status`, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const updated = this.unwrap(response);
          this.contact.update((current) => ({ ...(current ?? {}), ...(updated ?? {}), status }));
          this.busy.set(false);
          this.notification.success(status === 'NEW' ? 'Message marqué comme non lu.' : 'Message marqué comme lu.');
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
