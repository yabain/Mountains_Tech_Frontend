import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

interface EventForm {
  title: string;
  slug: string;
  category: string;
  location: string;
  startAt: string;
  endAt: string;
  excerpt: string;
  contentHtml: string;
  coverUrl: string;
  registrationRequired: boolean;
  capacity: string;
  status: string;
}

@Component({
  selector: 'app-admin-event-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-event-editor.component.html',
  styleUrl: '../../resource/admin-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEventEditorComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly eventId = this.route.snapshot.paramMap.get('id') ?? '';
  coverSource: 'url' | 'upload' = 'url';
  readonly form: EventForm = {
    title: '',
    slug: '',
    category: '',
    location: '',
    startAt: '',
    endAt: '',
    excerpt: '',
    contentHtml: '',
    coverUrl: '',
    registrationRequired: false,
    capacity: '',
    status: 'DRAFT'
  };

  constructor() {
    if (this.eventId) {
      this.loading.set(true);
      this.api.get<unknown>(`${API_ROUTES.admin.events}/${encodeURIComponent(this.eventId)}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const event = this.unwrap(response);
            if (!event) {
              this.error.set('Les informations de cet événement sont indisponibles.');
            } else {
              this.form.title = String(event['title'] ?? '');
              this.form.slug = String(event['slug'] ?? '');
              this.form.category = String(event['category'] ?? '');
              this.form.location = String(event['location'] ?? '');
              this.form.startAt = this.dateTimeInput(event['startAt']);
              this.form.endAt = this.dateTimeInput(event['endAt']);
              this.form.excerpt = String(event['excerpt'] ?? '');
              this.form.contentHtml = String(event['contentHtml'] ?? '');
              this.form.coverUrl = String(event['coverUrl'] ?? '');
              this.form.registrationRequired = event['registrationRequired'] === true;
              this.form.capacity = event['capacity'] == null ? '' : String(event['capacity']);
              this.form.status = String(event['status'] ?? 'DRAFT').toUpperCase();
            }
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Impossible de charger cet événement.');
            this.loading.set(false);
          }
        });
    }
  }

  submit(): void {
    if (this.saving() || this.loading()) return;
    if (!this.form.title.trim() || !this.form.startAt || !this.form.location.trim()) {
      this.error.set('Le titre, le lieu et la date de début sont obligatoires.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const coverUrl = this.form.coverUrl.trim();
    const payload = {
      title: this.form.title.trim(),
      ...(this.form.slug.trim() ? { slug: this.form.slug.trim() } : {}),
      ...(this.form.category.trim() ? { category: this.form.category.trim() } : {}),
      ...(this.form.location.trim() ? { location: this.form.location.trim() } : {}),
      startAt: new Date(this.form.startAt).toISOString(),
      endAt: this.form.endAt ? new Date(this.form.endAt).toISOString() : undefined,
      ...(this.form.excerpt.trim() ? { excerpt: this.form.excerpt.trim() } : {}),
      ...(this.form.contentHtml.trim() ? { contentHtml: this.form.contentHtml } : {}),
      ...(coverUrl ? { coverUrl: this.mediaUrl(coverUrl) } : {}),
      registrationRequired: this.form.registrationRequired,
      capacity: this.form.capacity ? Number(this.form.capacity) : undefined,
      status: this.form.status
    };
    const request = this.eventId
      ? this.api.patch<unknown>(`${API_ROUTES.admin.events}/${encodeURIComponent(this.eventId)}`, payload)
      : this.api.post<unknown>(API_ROUTES.admin.events, payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success(this.eventId ? 'L’événement a été mis à jour.' : 'L’événement a été créé.');
        void this.router.navigate(['/dashboard/events']);
      },
      error: (error: { error?: { message?: string | string[] } }) => {
        this.saving.set(false);
        const message = error.error?.message;
        this.error.set(Array.isArray(message) ? message.join(' · ') : message ?? 'Impossible d’enregistrer cet événement.');
      }
    });
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Sélectionnez un fichier image.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('L’image ne doit pas dépasser 10 Mo.');
      input.value = '';
      return;
    }
    const body = new FormData();
    body.append('file', file);
    this.uploading.set(true);
    this.error.set('');
    this.api.post<unknown>(API_ROUTES.admin.mediaUpload, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const result = this.unwrap(response);
          const url = result?.['url'] ?? result?.['imageUrl'] ?? result?.['coverUrl'];
          if (typeof url !== 'string' || !url) {
            this.error.set('Le téléversement a réussi, mais aucune URL d’image n’a été renvoyée.');
          } else {
            this.form.coverUrl = this.mediaUrl(url);
          }
          this.uploading.set(false);
        },
        error: () => {
          this.error.set('Impossible de téléverser l’image.');
          this.uploading.set(false);
        }
      });
  }

  cancel(): void {
    void this.router.navigate(['/dashboard/events']);
  }

  setCoverSource(source: 'url' | 'upload'): void {
    this.coverSource = source;
  }

  previewUrl(): string {
    return this.mediaUrl(this.form.coverUrl);
  }

  private unwrap(response: unknown): Record<string, unknown> | null {
    if (!response || typeof response !== 'object') return null;
    const outer = response as Record<string, unknown>;
    const data = outer['data'] && typeof outer['data'] === 'object'
      ? outer['data'] as Record<string, unknown>
      : outer;
    const item = data['event'] && typeof data['event'] === 'object'
      ? data['event'] as Record<string, unknown>
      : data;
    return item;
  }

  private dateTimeInput(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  private mediaUrl(value: unknown): string {
    const path = String(value ?? '').trim();
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return new URL(path.startsWith('/') ? path : `/${path}`, environment.apiUrl).toString();
  }
}
