import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/http/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { environment } from '../../../../environments/environment';
import { ADMIN_RESOURCE_CONFIG, AdminResourceConfig, ResourceField } from './admin-resource.config';

type FormValue = Record<string, unknown>;

@Component({
  selector: 'app-admin-resource-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-resource-editor.component.html',
  styleUrl: './admin-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminResourceEditorComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  readonly config = signal<AdminResourceConfig | null>(null);
  readonly form = signal<FormValue>({});
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploadingField = signal('');
  readonly error = signal('');
  readonly imageModes = signal<Record<string, 'url' | 'upload'>>({});
  readonly fields = computed(() => this.config()?.fields ?? []);
  readonly recordId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly title = computed(() => {
    const config = this.config();
    if (!config) return 'Formulaire';
    return `${this.recordId ? 'Modifier' : 'Créer'} : ${config.title.replace(/s$/, '')}`;
  });

  constructor() {
    const resourceKey = String(this.route.snapshot.data['resourceKey'] ?? '');
    const config = ADMIN_RESOURCE_CONFIG[resourceKey];
    if (!config) {
      this.error.set('Le formulaire demandé n’est pas disponible.');
      return;
    }
    this.config.set(config);
    this.form.set(this.initialForm(config.fields));
    if (this.recordId) this.load(config);
  }

  cancel(): void {
    const route = String(this.route.snapshot.data['listRoute'] ?? this.config()?.editorRoute ?? '/dashboard');
    void this.router.navigateByUrl(route);
  }

  setImageMode(fieldKey: string, mode: 'url' | 'upload'): void {
    this.imageModes.update((current) => ({ ...current, [fieldKey]: mode }));
  }

  imageMode(fieldKey: string): 'url' | 'upload' {
    return this.imageModes()[fieldKey] ?? 'url';
  }

  isImageField(field: ResourceField): boolean {
    return field.type === 'url' && ['coverUrl', 'logoUrl'].includes(field.key);
  }

  previewUrl(value: unknown): string {
    const path = String(value ?? '').trim();
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return new URL(path.startsWith('/') ? path : `/${path}`, environment.apiUrl).toString();
  }

  uploadImage(fieldKey: string, event: Event): void {
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
    this.uploadingField.set(fieldKey);
    this.error.set('');
    this.api.post<unknown>(API_ROUTES.admin.mediaUpload, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const item = this.unwrapRecord(response);
          const url = item?.['url'];
          if (typeof url !== 'string' || !url) {
            this.error.set('Le téléversement n’a pas renvoyé d’adresse de média.');
          } else {
            this.form.update((current) => ({ ...current, [fieldKey]: this.previewUrl(url) }));
          }
          this.uploadingField.set('');
        },
        error: () => {
          this.error.set('Impossible de téléverser cette image.');
          this.uploadingField.set('');
        }
      });
  }

  optionLabel(value: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      PUBLISHED: 'Publié',
      ARCHIVED: 'Archivé',
      ACTIVE: 'Actif',
      INACTIVE: 'Inactif',
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
      INSTITUTIONAL: 'Institutionnel',
      TECHNICAL: 'Technique',
      FINANCIAL: 'Financier',
      MEDIA: 'Médias',
      true: 'Oui',
      false: 'Non'
    };
    return labels[value] ?? value.replace(/_/g, ' ').toLowerCase();
  }

  submit(): void {
    const config = this.config();
    if (!config || this.saving() || this.loading() || this.uploadingField()) return;
    this.saving.set(true);
    this.error.set('');

    let payload = this.buildPayload(config.fields);
    if (!this.recordId && config.createDefaults) {
      payload = { ...config.createDefaults, ...payload };
    }
    const request = this.recordId
      ? this.api.patch<unknown>(`${config.endpoint}/${encodeURIComponent(this.recordId)}`, payload)
      : this.api.post<unknown>(config.createEndpoint ?? config.endpoint, payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success(this.recordId ? 'Les modifications ont été enregistrées.' : 'La création a été enregistrée.');
        this.cancel();
      },
      error: (error: { error?: { message?: string | string[] } }) => {
        this.saving.set(false);
        const message = error.error?.message;
        this.error.set(Array.isArray(message) ? message.join(' · ') : message ?? 'Impossible d’enregistrer ces informations.');
      }
    });
  }

  private load(config: AdminResourceConfig): void {
    this.loading.set(true);
    this.api.get<unknown>(`${config.endpoint}/${encodeURIComponent(this.recordId)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const record = this.unwrapRecord(response);
          if (!record) {
            this.error.set('Cet élément est introuvable.');
          } else {
            const form: FormValue = {};
            for (const field of config.fields) {
              const value = record[field.key];
              if (field.type === 'tags') {
                form[field.key] = this.tagsInputValue(value, field.key);
              } else if (field.type === 'date') {
                form[field.key] = this.dateInput(value);
              } else if (field.type === 'datetime') {
                form[field.key] = this.dateTimeInput(value);
              } else if (field.type === 'select' && typeof value === 'boolean') {
                form[field.key] = String(value);
              } else {
                form[field.key] = value ?? '';
              }
            }
            this.form.set(form);
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les informations de cet élément.');
          this.loading.set(false);
        }
      });
  }

  private initialForm(fields: ResourceField[]): FormValue {
    const form: FormValue = {};
    for (const field of fields) {
      form[field.key] = field.type === 'select' ? field.options?.[0] ?? '' : '';
    }
    return form;
  }

  private buildPayload(fields: ResourceField[]): FormValue {
    const payload: FormValue = {};
    for (const field of fields) {
      let value = this.form()[field.key];
      if (field.type === 'tags') {
        value = String(value ?? '').split(',').map((tag) => tag.trim()).filter(Boolean);
      } else if (field.type === 'number') {
        value = value === '' || value === null ? undefined : Number(value);
      } else if (field.type === 'select' && ['true', 'false'].includes(String(value))) {
        value = value === 'true';
      } else if (field.type === 'datetime' && value) {
        value = new Date(String(value)).toISOString();
      } else if (['coverUrl', 'logoUrl'].includes(field.key) && value) {
        value = this.previewUrl(value);
      }
      if (value !== undefined && value !== '') payload[field.key] = value;
    }
    return payload;
  }

  private tagsInputValue(value: unknown, fieldKey: string): string {
    if (!Array.isArray(value)) {
      return String(value ?? '');
    }

    return value
      .map((item) => {
        if (fieldKey === 'partners' && typeof item === 'object' && item !== null) {
          const partner = item as Record<string, unknown>;
          return String(partner['_id'] ?? partner['id'] ?? '');
        }
        return String(item);
      })
      .filter(Boolean)
      .join(', ');
  }

  private unwrapRecord(response: unknown): FormValue | null {
    const outer = this.asRecord(response);
    const data = this.asRecord(outer?.['data']) ?? outer;
    if (!data) return null;
    for (const key of ['project', 'hackathon', 'partner', 'member', 'application']) {
      const nested = this.asRecord(data[key]);
      if (nested) return nested;
    }
    return data;
  }

  private asRecord(value: unknown): FormValue | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as FormValue
      : null;
  }

  private dateInput(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  private dateTimeInput(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';
    const pad = (number: number): string => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
