import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { apiErrorMessage } from '../../../core/utils/api-error';

type EmailHistoryItem = Record<string, unknown>;

@Component({
  selector: 'app-admin-email-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-email-settings.component.html',
  styleUrl: './admin-email-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEmailSettingsComponent {
  private readonly pageSize = 10;
  private readonly destroyRef = inject(DestroyRef);

  readonly smtpExpanded = signal(false);
  readonly emailSearch = signal('');
  readonly emails = signal<EmailHistoryItem[]>([]);
  readonly loadingEmails = signal(false);
  readonly emailError = signal('');
  readonly emailPage = signal(1);
  readonly emailPages = signal(1);
  readonly emailTotal = signal(0);
  readonly emailStats = signal({ sent: 0, failed: 0, month: 0 });
  testEmail = '';
  testSubject = 'Test e-mail';
  testMessage = 'Ceci est un e-mail de test.';
  readonly testSending = signal(false);
  readonly testError = signal('');
  readonly testSuccess = signal('');

  constructor(private readonly api: ApiService) {
    this.loadEmails();
  }

  toggleSmtp(): void {
    this.smtpExpanded.update((expanded) => !expanded);
  }

  sendTestEmail(): void {
    if (this.testSending()) return;
    this.testError.set('');
    this.testSuccess.set('');

    if (!this.testEmail.trim() || !this.testSubject.trim() || !this.testMessage.trim()) {
      this.testError.set('Renseignez le destinataire, le sujet et le message.');
      return;
    }

    this.testSending.set(true);
    this.api.post<unknown>(`${API_ROUTES.admin.emails}/test`, {
      recipient: this.testEmail.trim(),
      subject: this.testSubject.trim(),
      message: this.testMessage.trim()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.testSending.set(false))
      )
      .subscribe({
        next: () => {
          this.testSuccess.set('E-mail de test envoyé.');
          this.loadEmails();
        },
        error: (error: unknown) => {
          this.testError.set(apiErrorMessage(error, 'Impossible d’envoyer l’e-mail de test.'));
        }
      });
  }

  onEmailSearch(value: string): void {
    this.emailSearch.set(value);
    this.emailPage.set(1);
    this.loadEmails();
  }

  previousEmailPage(): void {
    if (this.emailPage() <= 1) return;
    this.emailPage.update((page) => page - 1);
    this.loadEmails();
  }

  nextEmailPage(): void {
    if (this.emailPage() >= this.emailPages()) return;
    this.emailPage.update((page) => page + 1);
    this.loadEmails();
  }

  emailRecipients(email: EmailHistoryItem): string {
    const recipients = email['recipients'];
    return Array.isArray(recipients) ? recipients.map(String).join(', ') : '—';
  }

  emailType(email: EmailHistoryItem): string {
    const templates: Record<string, string> = {
      'contact-notification': 'Notification de contact',
      'contact-acknowledgment': 'Confirmation de contact',
      'member-application-confirmation': 'Confirmation de demande d’adhésion',
      'member-application-review': 'Réponse à une demande d’adhésion',
      'event-registration-confirmation': 'Confirmation d’inscription',
      'hackathon-team-confirmation': 'Confirmation d’équipe',
      'newsletter-subscription': 'Confirmation newsletter',
      'admin-invitation': 'Invitation administrateur',
      'test-email': 'E-mail de test',
      announcement: 'Annonce'
    };
    const type = String(email['template'] ?? '');
    return templates[type] ?? (type || 'E-mail système');
  }

  emailStatus(email: EmailHistoryItem): string {
    const status = String(email['status'] ?? '').toUpperCase();
    return status === 'SENT' ? 'Envoyé' : status === 'FAILED' ? 'Échec' : status || '—';
  }

  emailDate(email: EmailHistoryItem): string {
    const value = email['createdAt'];
    if (!value) return '—';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }

  private loadEmails(): void {
    this.loadingEmails.set(true);
    this.emailError.set('');
    this.api.get<unknown>(API_ROUTES.admin.emails, {
      page: this.emailPage(),
      limit: this.pageSize,
      search: this.emailSearch().trim()
    }).subscribe({
      next: (response) => {
        const root = this.asRecord(response);
        const data = this.asRecord(root?.['data']) ?? root;
        const items = Array.isArray(data?.['items'])
          ? data['items'].filter((item): item is EmailHistoryItem => this.asRecord(item) !== null)
          : [];
        const pagination = this.asRecord(data?.['pagination']);
        const stats = this.asRecord(data?.['stats']);
        this.emails.set(items);
        this.emailTotal.set(Number(pagination?.['total'] ?? 0));
        this.emailPages.set(Math.max(1, Number(pagination?.['pages'] ?? 1)));
        this.emailStats.set({
          sent: Number(stats?.['sent'] ?? 0),
          failed: Number(stats?.['failed'] ?? 0),
          month: Number(stats?.['month'] ?? 0)
        });
        this.loadingEmails.set(false);
      },
      error: () => {
        this.emailError.set('Impossible de charger l’historique des e-mails envoyés.');
        this.loadingEmails.set(false);
      }
    });
  }

  private asRecord(value: unknown): EmailHistoryItem | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as EmailHistoryItem
      : null;
  }
}
