import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { apiErrorMessage } from '../../../core/utils/api-error';

const config: AdminResourceConfig = {
  title: 'Médias',
  icon: 'bi-images',
  endpoint: API_ROUTES.admin.media,
  shape: 'items',
  searchable: true,
  creatable: true,
  deletable: true,
  columns: [
    { key: 'url', label: 'Aperçu', type: 'media' },
    { key: 'originalName', label: 'Nom' },
    { key: 'alt', label: 'Texte alternatif' },
    { key: 'mimeType', label: 'Type' },
    { key: 'size', label: 'Taille' }
  ],
  fields: []
};

type MediaMode = 'file' | 'url' | 'pdf';

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-media.component.html',
  styleUrl: './admin-media.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMediaComponent extends AdminResourceBase {
  private readonly destroyRef = inject(DestroyRef);

  readonly mediaModalOpen = signal(false);
  readonly mediaMode = signal<MediaMode>('file');
  readonly mediaFile = signal<File | null>(null);
  readonly mediaPreviewUrl = signal('');
  readonly mediaUrlValue = signal('');
  readonly mediaAlt = signal('');
  readonly mediaError = signal('');
  readonly mediaSaving = signal(false);
  readonly isDragOver = signal(false);

  private readonly allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];

  private sanitizeFileName(name: string): string {
    return name.replace(/[^\w\-.]/g, '').replace(/\.{2,}/g, '.');
  }

  private isAllowedFile(name: string): boolean {
    const lower = name.toLowerCase();
    return this.allowedExts.some(ext => lower.endsWith(ext));
  }

  openMediaCreate(): void {
    this.mediaMode.set('file');
    this.mediaFile.set(null);
    this.mediaUrlValue.set('');
    this.mediaAlt.set('');
    this.mediaError.set('');
    this.revokePreview();
    this.mediaModalOpen.set(true);
  }

  closeMediaCreate(): void {
    this.mediaModalOpen.set(false);
    this.mediaFile.set(null);
    this.mediaUrlValue.set('');
    this.mediaAlt.set('');
    this.mediaError.set('');
    this.revokePreview();
  }

  setMediaMode(mode: MediaMode): void {
    this.mediaMode.set(mode);
    this.mediaError.set('');
    if (mode === 'url') {
      this.mediaFile.set(null);
      this.revokePreview();
    }
  }

  onMediaFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.mediaFile.set(file);
    this.mediaError.set('');
    this.revokePreview();
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      if (!this.isAllowedFile(file.name)) {
        this.mediaError.set('Fichier non autorisé. Extensions acceptées : jpg, jpeg, png, gif, webp, pdf.');
        this.mediaFile.set(null);
        return;
      }
      // Nettoyer le nom du fichier contre les caractères dangereux
      const safeFile = new File([file], this.sanitizeFileName(file.name), { type: file.type, lastModified: file.lastModified });
      this.mediaFile.set(safeFile);
      this.mediaError.set('');
      this.revokePreview();
      if (file.type.startsWith('image/')) {
        this.mediaPreviewUrl.set(URL.createObjectURL(file));
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        if (!this.isAllowedFile(file.name)) {
          this.mediaError.set('Fichier non autorisé. Extensions acceptées : jpg, jpeg, png, gif, webp, pdf.');
          this.mediaFile.set(null);
          return;
        }
        const safeFile = new File([file], this.sanitizeFileName(file.name), { type: file.type, lastModified: file.lastModified });
        this.mediaFile.set(safeFile);
        this.mediaFile.set(file);
        this.mediaError.set('');
        this.revokePreview();
        if (file.type.startsWith('image/')) {
          this.mediaPreviewUrl.set(URL.createObjectURL(file));
        }
      } else {
        this.mediaError.set('Type de fichier non supporté. Accepté : images et PDF.');
      }
    }
  }

  onMediaUrlInput(value: string): void {
    this.mediaUrlValue.set(value.trim());
    this.mediaError.set('');
  }

  submitMedia(): void {
    if (this.mediaSaving()) return;
    this.mediaError.set('');

    if (this.mediaMode() === 'file' || this.mediaMode() === 'pdf') {
      const file = this.mediaFile();
      if (!file) {
        this.mediaError.set('Sélectionnez un fichier à envoyer.');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      if (this.mediaAlt().trim()) formData.append('alt', this.mediaAlt().trim());
      this.saveMedia(() => this.api.post<unknown>(API_ROUTES.admin.mediaUpload, formData), 'Média envoyé.');
      return;
    }

    const url = this.mediaUrlValue();
    if (!/^https?:\/\//i.test(url)) {
      this.mediaError.set('Saisissez une adresse URL complète (http:// ou https://).');
      return;
    }
    this.saveMedia(
      () => this.api.post<unknown>(API_ROUTES.admin.mediaLink, { url, alt: this.mediaAlt().trim() || undefined }),
      'Média enregistré depuis son adresse URL.'
    );
  }

  get currentMediaPreview(): string {
    return this.mediaMode() === 'url' ? this.mediaUrlValue() : this.mediaPreviewUrl();
  }

  private saveMedia(request: () => Observable<unknown>, successMessage: string): void {
    this.mediaSaving.set(true);
    request()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.mediaSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.notification.success(successMessage);
          this.closeMediaCreate();
          this.load();
        },
        error: (error: unknown) => {
          this.mediaError.set(apiErrorMessage(error, 'Impossible d’enregistrer ce média.'));
        }
      });
  }

  private revokePreview(): void {
    const preview = this.mediaPreviewUrl();
    if (preview) URL.revokeObjectURL(preview);
    this.mediaPreviewUrl.set('');
  }
}
