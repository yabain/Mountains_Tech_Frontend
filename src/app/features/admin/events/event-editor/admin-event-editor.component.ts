import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../../core/constants/api-routes';
import { ApiService } from '../../../../core/http/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface EventForm {
  title: string;
  slug: string;
  category: string;
  location: string;
  startAt: string;
  endAt: string;
  excerpt: string;
  program: string;
  coverUrl: string;
  contactPhone: string;
  contactEmail: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  registrationUrl: string;
  sponsors: string;
  showOnHome: boolean;
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
  readonly form: EventForm = {
    title: '',
    slug: '',
    category: '',
    location: '',
    startAt: '',
    endAt: '',
    excerpt: '',
    program: '',
    coverUrl: '',
    contactPhone: '',
    contactEmail: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    registrationUrl: '',
    sponsors: '',
    showOnHome: false,
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
              this.form.program = String(event['program'] ?? event['contentHtml'] ?? '');
              this.form.coverUrl = String(event['coverUrl'] ?? '');
              this.form.contactPhone = String(event['contactPhone'] ?? '');
              this.form.contactEmail = String(event['contactEmail'] ?? '');
              const socials = event['socials'] && typeof event['socials'] === 'object'
                ? event['socials'] as Record<string, unknown>
                : {};
              this.form.facebook = String(socials['facebook'] ?? event['facebook'] ?? '');
              this.form.instagram = String(socials['instagram'] ?? event['instagram'] ?? '');
              this.form.linkedin = String(socials['linkedin'] ?? event['linkedin'] ?? '');
              this.form.registrationUrl = String(event['registrationUrl'] ?? '');
              this.form.sponsors = this.stringList(event['sponsors'] ?? event['partners']);
              this.form.showOnHome = event['showOnHome'] === true || event['featured'] === true;
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
    if (this.form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.contactEmail)) {
      this.error.set('L’adresse e-mail de contact est invalide.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const payload = {
      title: this.form.title.trim(),
      slug: this.form.slug.trim(),
      category: this.form.category.trim(),
      location: this.form.location.trim(),
      startAt: new Date(this.form.startAt).toISOString(),
      endAt: this.form.endAt ? new Date(this.form.endAt).toISOString() : undefined,
      excerpt: this.form.excerpt.trim(),
      contentHtml: this.form.program,
      program: this.form.program,
      coverUrl: this.form.coverUrl.trim(),
      contactPhone: this.form.contactPhone.trim(),
      contactEmail: this.form.contactEmail.trim(),
      socials: {
        facebook: this.form.facebook.trim(),
        instagram: this.form.instagram.trim(),
        linkedin: this.form.linkedin.trim()
      },
      registrationUrl: this.form.registrationUrl.trim(),
      sponsors: this.listValues(this.form.sponsors),
      showOnHome: this.form.showOnHome,
      registrationRequired: this.form.registrationRequired,
      capacity: this.form.capacity ? Number(this.form.capacity) : undefined,
      status: this.form.status
    };
    const request = this.eventId
      ? this.api.put<unknown>(`${API_ROUTES.admin.events}/${encodeURIComponent(this.eventId)}`, payload)
      : this.api.post<unknown>(API_ROUTES.admin.events, payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success(this.eventId ? 'L’événement a été mis à jour.' : 'L’événement a été créé.');
        void this.router.navigate(['/dashboard/events']);
      },
      error: (error: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.error.set(error.error?.message ?? 'Impossible d’enregistrer cet événement.');
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
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('L’image ne doit pas dépasser 5 Mo.');
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
            this.form.coverUrl = url;
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

  private stringList(value: unknown): string {
    return Array.isArray(value)
      ? value.map((item) => typeof item === 'object' && item !== null
        ? String((item as Record<string, unknown>)['name'] ?? '')
        : String(item)).filter(Boolean).join(', ')
      : String(value ?? '');
  }

  private listValues(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}
