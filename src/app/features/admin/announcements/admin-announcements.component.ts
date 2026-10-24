import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

const config: AdminResourceConfig = {
  title: 'Annonces',
  icon: 'bi-megaphone-fill',
  endpoint: API_ROUTES.admin.announcements,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['DRAFT', 'SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'],
  columns: [
    { key: 'subject', label: 'Objet' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'recipientCount', label: 'Destinataires' },
    { key: 'createdAt', label: 'Créée le', type: 'date' }
  ],
  fields: [],
  creatable: true,
  editable: false,
  deletable: false,
  createRoute: '/dashboard/announcements/new'
};

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-announcements.component.html',
  styleUrl: './admin-announcements.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAnnouncementsComponent extends AdminResourceBase {
  private readonly announcementsRouter = inject(Router);
  private readonly announcementsApi = inject(ApiService);
  private readonly announcementsNotification = inject(NotificationService);
  readonly statusCounts = signal({ drafts: 0, scheduled: 0, sending: 0, sent: 0, failed: 0, cancelled: 0 });
  readonly audienceFilter = signal('');
  readonly visibleAnnouncements = computed(() => this.rows().filter((row) => {
    const audience = this.audienceFilter();
    return !audience || this.audienceGroups(row).includes(audience);
  }));
  readonly announcementStats = computed(() => {
    const counts = this.statusCounts();
    return { ...counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
  });

  constructor() {
    super();
    this.loadStatusCounts();
  }

  private loadStatusCounts(): void {
    const statuses = ['DRAFT', 'SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'] as const;
    forkJoin(statuses.map((status) =>
      this.announcementsApi.get<unknown>(API_ROUTES.admin.announcements, { status, page: 1, limit: 1 })
    )).pipe(takeUntilDestroyed()).subscribe({
      next: (responses) => {
        const values = responses.map((response) => this.extractTotal(response));
        this.statusCounts.set({
          drafts: values[0],
          scheduled: values[1],
          sending: values[2],
          sent: values[3],
          failed: values[4],
          cancelled: values[5]
        });
      },
      error: () => this.announcementsNotification.error('Impossible de charger les statistiques des annonces.')
    });
  }

  setStatusFilter(status: string): void {
    this.onStatusFilterChange(status);
  }

  goToEmailSettings(): void {
    void this.announcementsRouter.navigate(['/dashboard/email-settings']);
  }

  editAnnouncement(row: Record<string, any>): void {
    if (String(row['status'] ?? '').toUpperCase() === 'DRAFT') {
      void this.announcementsRouter.navigate(['/dashboard/announcements', this.rowId(row), 'edit']);
    }
  }

  audienceGroups(row: Record<string, any>): string[] {
    const groups = row['audience']?.['groups'];
    return Array.isArray(groups) ? groups.map((group) => String(group).toUpperCase()) : [];
  }

  audienceLabel(row: Record<string, any>): string {
    const groups = this.audienceGroups(row);
    const labels: Record<string, string> = {
      ALL: 'Tous',
      MEMBERS: 'Membres',
      NEWSLETTER: 'Newsletter',
      EVENT_PARTICIPANTS: 'Participants',
      HACKATHON_TEAMS: 'Équipes hackathon',
      CUSTOM: 'Personnalisé'
    };
    if (!groups.length) return '—';
    return groups.map((group) => labels[group] ?? group).join(', ');
  }

  announcementStatus(row: Record<string, any>): string {
    const status = String(row['status'] ?? '').toUpperCase();
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SCHEDULED: 'Programmée',
      PROCESSING: 'En cours d’envoi',
      SENT: 'Envoyée',
      FAILED: 'Échec',
      CANCELLED: 'Annulée'
    };
    return labels[status] ?? (status || '—');
  }

  announcementStatusClass(row: Record<string, any>): string {
    const status = String(row['status'] ?? '').toUpperCase();
    return `announcement-status announcement-status--${status.toLowerCase() || 'unknown'}`;
  }

  announcementDate(row: Record<string, any>): string {
    const value = row['scheduledAt'] ?? row['sentAt'] ?? row['createdAt'];
    if (!value) {
      return '—';
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }

  announcementProgress(row: Record<string, any>): string {
    const status = String(row['status'] ?? '').toUpperCase();
    const recipients = Number(row['recipientCount'] ?? 0);
    const metrics = (row['metrics'] ?? {}) as Record<string, unknown>;
    const processed = Number(metrics['sent'] ?? row['sentCount'] ?? 0);
    if (status === 'SENT') {
      return `${recipients} / ${recipients}`;
    }
    if (status === 'PROCESSING') {
      return `${processed} / ${recipients}`;
    }
    return '—';
  }

  sendAnnouncement(row: Record<string, any>): void {
    const id = this.rowId(row);
    if (!id || !confirm(`Envoyer immédiatement « ${row['subject'] ?? 'cette annonce'} » ?`)) return;
    this.announcementsApi.post<unknown>(adminDynamicRoutes.announcementSend(id), {})
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.announcementsNotification.success('Envoi lancé.');
          this.load();
          this.loadStatusCounts();
        },
        error: (error: unknown) => {
          this.announcementsNotification.error(apiErrorMessage(error, 'Impossible de lancer l’envoi.'));
        }
      });
  }

  cancelAnnouncement(row: Record<string, any>): void {
    const id = this.rowId(row);
    if (!id || !confirm('Annuler cet envoi programmé ?')) return;
    this.announcementsApi.post<unknown>(adminDynamicRoutes.announcementCancel(id), {})
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.announcementsNotification.success('Envoi programmé annulé.');
          this.load();
          this.loadStatusCounts();
        },
        error: (error: unknown) => {
          this.announcementsNotification.error(apiErrorMessage(error, 'Impossible d’annuler cet envoi.'));
        }
      });
  }

  private extractTotal(response: unknown): number {
    if (typeof response !== 'object' || response === null) {
      return 0;
    }
    const outer = response as Record<string, unknown>;
    const data = typeof outer['data'] === 'object' && outer['data'] !== null
      ? outer['data'] as Record<string, unknown>
      : outer;
    const pagination = typeof data['pagination'] === 'object' && data['pagination'] !== null
      ? data['pagination'] as Record<string, unknown>
      : null;
    const total = pagination?.['total'] ?? data['total'] ?? outer['total'];
    return typeof total === 'number' && Number.isFinite(total) ? total : 0;
  }
}
