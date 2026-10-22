import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

interface ActivityForm {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  contentHtml: string;
  coverUrl: string;
  status: string;
}

@Component({
  selector: 'app-admin-activity-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-activity-editor.component.html',
  styleUrl: '../../resource/admin-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminActivityEditorComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly activityId = this.route.snapshot.paramMap.get('id') ?? '';
  coverSource: 'url' | 'upload' = 'url';
  readonly form: ActivityForm = {
    title: '',
    slug: '',
    category: '',
    excerpt: '',
    contentHtml: '',
    coverUrl: '',
    status: 'DRAFT'
  };

  constructor() {
    if (this.activityId) {
      this.loading.set(true);
      this.api.get<unknown>(`${API_ROUTES.admin.activities}/${encodeURIComponent(this.activityId)}`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const item = this.unwrap(response);
            if (!item) {
              this.error.set('Les informations de cette actualité sont indisponibles.');
            } else {
              this.form.title = String(item['title'] ?? '');
              this.form.slug = String(item['slug'] ?? '');
              this.form.category = String(item['category'] ?? '');
              this.form.excerpt = String(item['excerpt'] ?? item['description'] ?? '');
              this.form.contentHtml = String(item['contentHtml'] ?? '');
              this.form.coverUrl = String(item['coverUrl'] ?? item['imageUrl'] ?? '');
              this.form.status = String(item['status'] ?? 'DRAFT').toUpperCase();
            }
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Impossible de charger cette actualité.');
            this.loading.set(false);
          }
        });
    }
  }

  submit(): void {
    if (this.saving() || this.loading()) return;
    if (!this.form.title.trim() || !this.form.contentHtml.trim()) {
      this.error.set('Le titre et le contenu sont obligatoires.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const coverUrl = this.form.coverUrl.trim();
    const payload = {
      title: this.form.title.trim(),
      ...(this.form.slug.trim() ? { slug: this.form.slug.trim() } : {}),
      ...(this.form.category.trim() ? { category: this.form.category.trim() } : {}),
      ...(this.form.excerpt.trim() ? { excerpt: this.form.excerpt.trim() } : {}),
      contentHtml: this.form.contentHtml,
      ...(coverUrl ? { coverUrl: this.mediaUrl(coverUrl) } : {}),
      status: this.form.status
    };
    const request = this.activityId
      ? this.api.patch<unknown>(`${API_ROUTES.admin.activities}/${encodeURIComponent(this.activityId)}`, payload)
      : this.api.post<unknown>(API_ROUTES.admin.activities, payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success(this.activityId ? 'L’actualité a été mise à jour.' : 'L’actualité a été créée.');
        void this.router.navigate(['/dashboard/activities']);
      },
      error: (error: { error?: { message?: string | string[] } }) => {
        this.saving.set(false);
        const message = error.error?.message;
        this.error.set(Array.isArray(message) ? message.join(' · ') : message ?? 'Impossible d’enregistrer cette actualité.');
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
          const record = this.unwrap(response);
          const url = record?.['url'] ?? record?.['imageUrl'] ?? record?.['coverUrl'];
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
    void this.router.navigate(['/dashboard/activities']);
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
    const item = data['activity'] && typeof data['activity'] === 'object'
      ? data['activity'] as Record<string, unknown>
      : data;
    return item;
  }

  private mediaUrl(value: unknown): string {
    const path = String(value ?? '').trim();
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return new URL(path.startsWith('/') ? path : `/${path}`, environment.apiUrl).toString();
  }
}
