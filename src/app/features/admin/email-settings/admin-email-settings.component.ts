import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { apiErrorMessage } from '../../../core/utils/api-error';

interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  from: string;
  alertEmail: string;
  encryption: 'SSL/TLS' | 'STARTTLS' | 'NONE';
}

const SMTP_SETTING_KEYS = {
  host: 'emailSmtpHost',
  port: 'emailSmtpPort',
  user: 'emailSmtpUser',
  from: 'emailSmtpFrom',
  alertEmail: 'emailAlertAddress',
  encryption: 'emailSmtpEncryption'
} as const;

@Component({
  selector: 'app-admin-email-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-email-settings.component.html',
  styleUrl: './admin-email-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEmailSettingsComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly smtpExpanded = signal(false);
  readonly loadingSettings = signal(false);
  readonly savingSettings = signal(false);
  readonly settingsError = signal('');
  readonly settingsSuccess = signal('');
  readonly smtpSettings = signal<SmtpSettings>({
    host: '',
    port: 465,
    user: '',
    from: '',
    alertEmail: '',
    encryption: 'SSL/TLS'
  });
  testEmail = '';
  readonly testSending = signal(false);
  readonly testError = signal('');
  readonly testSuccess = signal('');

  constructor(private readonly api: ApiService) {
    this.loadSmtpSettings();
  }

  toggleSmtp(): void {
    this.smtpExpanded.update((expanded) => !expanded);
  }

  sendTestEmail(): void {
    if (this.testSending()) return;
    this.testError.set('');
    this.testSuccess.set('');

    if (!this.testEmail.trim()) {
      this.testError.set('Renseignez le destinataire.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.testEmail.trim())) {
      this.testError.set('Renseignez une adresse e-mail valide.');
      return;
    }

    this.testSending.set(true);
    this.api.post<unknown>(`${API_ROUTES.admin.emails}/test`, {
      to: this.testEmail.trim()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.testSending.set(false))
      )
      .subscribe({
        next: () => {
          this.testSuccess.set('La demande de test a été acceptée par le backend. La livraison réelle n’est pas confirmée par cette API.');
        },
        error: (error: unknown) => {
          this.testError.set(apiErrorMessage(error, 'Impossible d’envoyer l’e-mail de test.'));
        }
      });
  }

  updateSmtpSetting<K extends keyof SmtpSettings>(key: K, value: SmtpSettings[K]): void {
    this.smtpSettings.update((settings) => ({ ...settings, [key]: value }));
  }

  saveSmtpSettings(): void {
    if (this.savingSettings()) return;
    this.settingsError.set('');
    this.settingsSuccess.set('');

    const settings = this.smtpSettings();
    if (!settings.host.trim() || !settings.user.trim() || !settings.from.trim() || !settings.alertEmail.trim()) {
      this.settingsError.set('Renseignez le serveur, l’utilisateur et les deux adresses e-mail.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(settings.from.trim()) || !emailPattern.test(settings.alertEmail.trim())) {
      this.settingsError.set('Renseignez des adresses e-mail valides pour l’envoi et les alertes.');
      return;
    }
    if (!Number.isInteger(settings.port) || settings.port < 1 || settings.port > 65535) {
      this.settingsError.set('Le port doit être un nombre compris entre 1 et 65535.');
      return;
    }

    const values: Record<string, unknown> = {
      [SMTP_SETTING_KEYS.host]: settings.host.trim(),
      [SMTP_SETTING_KEYS.port]: settings.port,
      [SMTP_SETTING_KEYS.user]: settings.user.trim(),
      [SMTP_SETTING_KEYS.from]: settings.from.trim(),
      [SMTP_SETTING_KEYS.alertEmail]: settings.alertEmail.trim(),
      [SMTP_SETTING_KEYS.encryption]: settings.encryption
    };

    this.savingSettings.set(true);
    this.api.patch<unknown>(API_ROUTES.admin.settings, values)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingSettings.set(false))
      )
      .subscribe({
        next: () => this.settingsSuccess.set('Réglages enregistrés. Ils ne sont pas encore utilisés par le service d’envoi du backend.'),
        error: (error: unknown) => {
          this.settingsError.set(apiErrorMessage(error, 'Impossible d’enregistrer les réglages.'));
        }
      });
  }

  private loadSmtpSettings(): void {
    this.loadingSettings.set(true);
    this.settingsError.set('');
    this.api.get<unknown>(API_ROUTES.admin.settings)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSettings.set(false))
      )
      .subscribe({
        next: (response) => {
          const root = this.asRecord(response);
          const data = this.asRecord(root?.['data']) ?? root;
          if (!data) return;

          const current = this.smtpSettings();
          this.smtpSettings.set({
            host: String(data[SMTP_SETTING_KEYS.host] ?? current.host),
            port: Number(data[SMTP_SETTING_KEYS.port] ?? current.port),
            user: String(data[SMTP_SETTING_KEYS.user] ?? current.user),
            from: String(data[SMTP_SETTING_KEYS.from] ?? current.from),
            alertEmail: String(data[SMTP_SETTING_KEYS.alertEmail] ?? current.alertEmail),
            encryption: this.encryption(data[SMTP_SETTING_KEYS.encryption])
          });
        },
        error: (error: unknown) => {
          this.settingsError.set(apiErrorMessage(error, 'Impossible de charger les réglages enregistrés.'));
        }
      });
  }

  private encryption(value: unknown): SmtpSettings['encryption'] {
    return value === 'STARTTLS' || value === 'NONE' ? value : 'SSL/TLS';
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }
}
