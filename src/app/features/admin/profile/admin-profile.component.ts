import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { API_ROUTES } from '../../../core/constants/api-routes';
import { AuthService, AuthUser } from '../../../core/auth/services/auth.service';
import { ApiService } from '../../../core/http/api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { environment } from '../../../../environments/environment';
import { normalizeRole } from '../admin-navigation';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super-administrateur',
  ADMIN: 'Administrateur',
  EDITOR: 'Éditeur',
  COMMUNICATION: 'Communication'
};

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.auth.currentUser$.value;
  readonly firstName = signal(this.user?.firstName ?? this.namePart(0));
  readonly lastName = signal(this.user?.lastName ?? this.namePart(1));
  readonly avatar = signal(this.user?.avatar ?? '');
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly saved = signal(false);

  get displayName(): string {
    return [this.firstName(), this.lastName()].filter(Boolean).join(' ') || this.user?.name || 'Utilisateur';
  }

  get roleLabel(): string {
    const role = this.user ? normalizeRole(this.user.role) : null;
    return role ? ROLE_LABELS[role] : this.user?.role ?? '';
  }

  get initials(): string {
    return this.displayName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || '?';
  }

  formattedDate(value?: string): string {
    if (!value) return 'Non renseignée';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Non renseignée' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  saveProfile(): void {
    if (this.saving()) return;
    if (!this.user) {
      this.error.set('Votre session utilisateur est indisponible. Reconnectez-vous puis réessayez.');
      return;
    }
    if (!this.firstName().trim() || !this.lastName().trim()) {
      this.error.set('Saisissez votre prénom et votre nom avant d’enregistrer.');
      return;
    }

    const firstName = this.firstName().trim();
    const lastName = this.lastName().trim();
    this.saving.set(true);
    this.error.set('');
    this.saved.set(false);

    this.api.patch<unknown>(`${API_ROUTES.admin.users}/${encodeURIComponent(this.user.id)}`, {
      firstName,
      lastName
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.auth.updateCurrentUser({ firstName, lastName, name: `${firstName} ${lastName}` });
        this.saving.set(false);
        this.saved.set(true);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Impossible d’enregistrer les modifications du profil.'));
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Choisissez un fichier image.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('La photo ne doit pas dépasser 5 Mo.');
      input.value = '';
      return;
    }

    this.uploading.set(true);
    this.error.set('');
    this.saved.set(false);
    void this.convertAndUpload(file, input);
  }

  removeAvatar(): void {
    if (!this.user || !this.avatar() || this.uploading()) return;
    this.uploading.set(true);
    this.error.set('');
    this.api.patch<unknown>(`${API_ROUTES.admin.users}/${encodeURIComponent(this.user.id)}`, { avatar: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.avatar.set('');
          this.auth.updateCurrentUser({ avatar: undefined });
          this.uploading.set(false);
        },
        error: (error: unknown) => {
          this.uploading.set(false);
          this.error.set(apiErrorMessage(error, 'Impossible de supprimer la photo de profil.'));
        }
      });
  }

  private async convertAndUpload(file: File, input: HTMLInputElement): Promise<void> {
    try {
      const webp = await this.toWebp(file);
      const body = new FormData();
      body.append('file', webp);
      this.api.post<unknown>(API_ROUTES.admin.mediaUpload, body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const record = this.unwrap(response);
            const rawUrl = record?.['url'] ?? record?.['imageUrl'];
            if (typeof rawUrl !== 'string' || !rawUrl) {
              this.error.set('Le téléversement n’a pas renvoyé d’adresse de photo.');
              this.uploading.set(false);
              return;
            }
            const avatar = this.mediaUrl(rawUrl);
            this.api.patch<unknown>(`${API_ROUTES.admin.users}/${encodeURIComponent(this.user?.id ?? '')}`, { avatar })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.avatar.set(avatar);
                  this.auth.updateCurrentUser({ avatar });
                  this.uploading.set(false);
                },
                error: (error: unknown) => {
                  this.uploading.set(false);
                  this.error.set(apiErrorMessage(error, 'La photo a été téléversée, mais n’a pas pu être appliquée au profil.'));
                }
              });
          },
          error: (error: unknown) => {
            this.uploading.set(false);
            this.error.set(apiErrorMessage(error, 'Impossible de téléverser la photo de profil.'));
          }
        });
    } catch {
      this.uploading.set(false);
      this.error.set('Impossible de convertir cette image au format WebP.');
    } finally {
      input.value = '';
    }
  }

  private async toWebp(file: File): Promise<File> {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      image.close();
      throw new Error('Canvas context is unavailable.');
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('WebP conversion failed.')), 'image/webp', 0.86);
    });
    const name = file.name.replace(/\.[^.]+$/, '') || 'profile-photo';
    return new File([blob], `${name}.webp`, { type: 'image/webp', lastModified: Date.now() });
  }

  private namePart(index: number): string {
    return this.user?.name.trim().split(/\s+/)[index] ?? '';
  }

  private mediaUrl(value: string): string {
    if (/^https?:\/\//i.test(value)) return value;
    return new URL(value.startsWith('/') ? value : `/${value}`, environment.apiUrl).toString();
  }

  private unwrap(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const root = value as Record<string, unknown>;
    const data = typeof root['data'] === 'object' && root['data'] !== null
      ? root['data'] as Record<string, unknown>
      : root;
    const item = typeof data['media'] === 'object' && data['media'] !== null
      ? data['media'] as Record<string, unknown>
      : data;
    return item;
  }
}
