import { Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';

export type ActivitySlotTone = 'success' | 'pending' | 'danger' | 'neutral';

export interface ActivityEntry {
  initials: string;
  name: string;
  detail: string;
  time: string;
  status?: string;
  statusTone: ActivitySlotTone;
}

export interface ActivitySection {
  key: string;
  label: string;
  icon: string;
  link: string;
  entries: ActivityEntry[];
  total: number;
}

interface CategoryDef {
  key: string;
  label: string;
  icon: string;
  link: string;
  endpoint: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'members', label: 'Membres', icon: 'bi-person-badge-fill', link: '/dashboard/members', endpoint: API_ROUTES.admin.members },
  { key: 'contacts', label: 'Contacts', icon: 'bi-person-lines-fill', link: '/dashboard/contacts', endpoint: API_ROUTES.admin.contacts },
  { key: 'events', label: 'Événements', icon: 'bi-calendar-event-fill', link: '/dashboard/events', endpoint: API_ROUTES.admin.events },
  { key: 'activities', label: 'Activités', icon: 'bi-lightning-charge-fill', link: '/dashboard/activities', endpoint: API_ROUTES.admin.activities },
  { key: 'projects', label: 'Projets', icon: 'bi-kanban-fill', link: '/dashboard/projects', endpoint: API_ROUTES.admin.projects },
  { key: 'hackathons', label: 'Hackathons', icon: 'bi-trophy-fill', link: '/dashboard/hackathons', endpoint: API_ROUTES.admin.hackathons },
  { key: 'partners', label: 'Partenaires', icon: 'bi-building-fill', link: '/dashboard/partners', endpoint: API_ROUTES.admin.partners },
  { key: 'media', label: 'Médias', icon: 'bi-images', link: '/dashboard/media', endpoint: API_ROUTES.admin.media },
  { key: 'newsletter', label: 'Newsletter', icon: 'bi-envelope-paper-fill', link: '/dashboard/newsletter', endpoint: API_ROUTES.admin.newsletter },
  { key: 'announcements', label: 'Annonces', icon: 'bi-megaphone-fill', link: '/dashboard/announcements', endpoint: API_ROUTES.admin.announcements },
  { key: 'users', label: 'Utilisateurs', icon: 'bi-people-fill', link: '/dashboard/users', endpoint: API_ROUTES.admin.users },
  { key: 'audit-logs', label: "Journaux d'audit", icon: 'bi-journal-text', link: '/dashboard/audit-logs', endpoint: API_ROUTES.admin.auditLogs },
  { key: 'settings', label: 'Paramètres', icon: 'bi-sliders', link: '/dashboard/settings', endpoint: API_ROUTES.admin.settings }
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  NEW: 'Nouveau',
  DRAFT: 'Brouillon',
  APPROVED: 'Approuvé',
  PUBLISHED: 'Publié',
  ACTIVE: 'Actif',
  RESOLVED: 'Résolu',
  SUBSCRIBED: 'Abonné',
  IN_PROGRESS: 'En cours',
  INACTIVE: 'Inactif',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
  UNSUBSCRIBED: 'Désabonné',
  SPAM: 'Spam'
};

const STATUS_TONE: Record<string, ActivitySlotTone> = {
  APPROVED: 'success',
  PUBLISHED: 'success',
  ACTIVE: 'success',
  RESOLVED: 'success',
  SUBSCRIBED: 'success',
  CONFIRMED: 'success',
  PENDING: 'pending',
  NEW: 'pending',
  DRAFT: 'pending',
  REJECTED: 'danger',
  SPAM: 'danger',
  SUSPENDED: 'danger',
  INACTIVE: 'neutral',
  ARCHIVED: 'neutral',
  UNSUBSCRIBED: 'neutral'
};

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  readonly sections = signal<ActivitySection[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  private started = false;

  constructor(private readonly api: ApiService) {}

  categories(): CategoryDef[] {
    return CATEGORIES;
  }

  load(force = false): void {
    if (this.started && !force) {
      return;
    }
    this.started = true;
    this.loading.set(true);
    this.error.set('');

    const requests = CATEGORIES.map((category) => this.fetchRows(category.endpoint));

    forkJoin(requests).subscribe({
      next: (results) => {
        this.sections.set(CATEGORIES.map((category, index) => this.buildSection(category, results[index])));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Les données du tableau de bord sont indisponibles.');
        this.loading.set(false);
      }
    });
  }

  statusLabel(status: unknown): string {
    const raw = String(status ?? '').toUpperCase();
    return STATUS_LABELS[raw] ?? String(status ?? '');
  }

  statusTone(status: unknown): ActivitySlotTone {
    return STATUS_TONE[String(status ?? '').toUpperCase()] ?? 'neutral';
  }

  private fetchRows(endpoint: string): Observable<Record<string, unknown>[]> {
    return this.api.get<unknown>(endpoint, { limit: 5 }).pipe(
      map((response) => this.extractItems(response)),
      catchError(() => of([] as Record<string, unknown>[]))
    );
  }

  private buildSection(category: CategoryDef, rows: Record<string, unknown>[]): ActivitySection {
    const sorted = [...rows]
      .map((row) => ({ row, at: new Date(this.dateOf(row)).getTime() }))
      .sort((a, b) => b.at - a.at)
      .map((item) => item.row);

    return {
      key: category.key,
      label: category.label,
      icon: category.icon,
      link: category.link,
      entries: sorted.slice(0, 2).map((row) => this.mapEntry(category, row)),
      total: sorted.length
    };
  }

  private mapEntry(category: CategoryDef, row: Record<string, unknown>): ActivityEntry {
    const value = (field: string): string => {
      const v = row[field];
      return v === null || v === undefined || v === '' ? '' : String(v);
    };

    let name = '';
    let detail = '';
    const rawStatus = value('status');

    switch (category.key) {
      case 'members':
        name = value('representativeName') || value('companyName');
        detail = value('companyName') || value('legalForm') || value('representativeEmail');
        break;
      case 'contacts':
        name = value('name');
        detail = value('subject') || value('email');
        break;
      case 'newsletter':
        name = [value('firstName'), value('lastName')].filter(Boolean).join(' ') || value('email');
        detail = value('email');
        break;
      case 'announcements':
        name = value('subject') || value('title');
        detail = value('recipientCount') ? `Destinataires : ${value('recipientCount')}` : value('type');
        break;
      case 'users':
        name = [value('firstName'), value('lastName')].filter(Boolean).join(' ') || value('email');
        detail = value('email') || value('role');
        break;
      case 'media':
        name = value('originalName') || value('filename');
        detail = value('alt') || value('mimeType');
        break;
      case 'audit-logs':
        name = value('action');
        detail = value('entity') || '';
        break;
      case 'settings':
        name = value('key');
        detail = this.truncate(value('value'), 60);
        break;
      case 'events':
        name = value('title');
        detail = value('location') || value('category');
        break;
      case 'activities':
        name = value('title');
        detail = value('category') || this.truncate(value('excerpt'), 60);
        break;
      case 'projects':
        name = value('title');
        detail = this.truncate(value('excerpt'), 60);
        break;
      case 'hackathons':
        name = value('title');
        detail = this.truncate(value('description'), 60);
        break;
      case 'partners':
        name = value('name');
        detail = value('type');
        break;
    }

    return {
      initials: this.initials(name) || this.initials(category.label),
      name: name || category.label,
      detail,
      time: this.formatAge(this.dateOf(row)),
      status: rawStatus ? this.statusLabel(rawStatus) : undefined,
      statusTone: rawStatus ? this.statusTone(rawStatus) : 'neutral'
    };
  }

  private dateOf(row: Record<string, unknown>): string {
    for (const field of ['createdAt', 'startAt', 'startDate', 'publishedAt']) {
      const v = row[field];
      if (typeof v === 'string' && v) {
        return v;
      }
    }
    return '';
  }

  private initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const letters = words.slice(0, 2).map((word) => word.charAt(0)).join('');
    return letters.toUpperCase();
  }

  private truncate(text: string, length: number): string {
    return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
  }

  private formatAge(date: string): string {
    if (!date) {
      return '';
    }
    const at = new Date(date).getTime();
    if (Number.isNaN(at)) {
      return '';
    }
    const minutes = Math.max(0, Math.round((Date.now() - at) / 60000));
    if (minutes < 1) {
      return "À l'instant";
    }
    if (minutes < 60) {
      return `Il y a ${minutes} min`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `Il y a ${hours} h`;
    }
    const days = Math.round(hours / 24);
    return `Il y a ${days} j`;
  }

  private extractItems(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response.filter((item) => this.isRecord(item));
    }
    if (this.isRecord(response)) {
      const data = response['data'];
      if (Array.isArray(data)) {
        return data.filter((item) => this.isRecord(item));
      }
      if (this.isRecord(data) && Array.isArray(data['items'])) {
        return data['items'].filter((item) => this.isRecord(item));
      }
    }
    return [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}