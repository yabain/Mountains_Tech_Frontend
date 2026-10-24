import { Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';

export type ActivitySlotTone = 'success' | 'pending' | 'danger' | 'neutral';

export interface ActivityEntry {
  id: string;
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

export interface DashboardMetrics {
  unreadMessages: number | null;
  announcements: number | null;
  resources: number | null;
  programs: number | null;
}

export interface DashboardActivityPoint {
  label: string;
  value: number;
  x: number;
  y: number;
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
  SCHEDULED: 'Programmé',
  PROCESSING: 'En cours d’envoi',
  SENDING: 'En cours d’envoi',
  SENT: 'Envoyé',
  FAILED: 'Échec',
  CANCELLED: 'Annulé',
  CANCELED: 'Annulé',
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
  readonly metrics = signal<DashboardMetrics>({
    unreadMessages: null,
    announcements: null,
    resources: null,
    programs: null
  });
  readonly activityRows = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly hasUnseen = signal(false);

  private started = false;
  private readonly seenStorageKey = 'mountains-tech-admin-seen-notifications';

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
        const sections = CATEGORIES.map((category, index) => this.buildSection(category, results[index].items, results[index].total));
        this.sections.set(sections);
        this.hasUnseen.set(sections.some((section) => section.entries.length > 0));
        this.activityRows.set(results.flatMap((result) => result.items));
        this.metrics.set({
          unreadMessages: this.countUnreadMessages(results[CATEGORIES.findIndex(({ key }) => key === 'contacts')]),
          announcements: results[CATEGORIES.findIndex(({ key }) => key === 'announcements')].total,
          resources: results[CATEGORIES.findIndex(({ key }) => key === 'media')].total,
          programs: results[CATEGORIES.findIndex(({ key }) => key === 'events')].total
        });
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

  markNotificationsSeen(filterCurrent = true): void {
    const seen = this.readSeenNotifications();
    for (const section of this.sections()) {
      for (const entry of section.entries) {
        if (entry.id) seen.add(`${section.key}:${entry.id}`);
      }
    }
    this.hasUnseen.set(false);
    this.persistSeen(seen);
    this.started = false;

    if (filterCurrent) {
      this.sections.update((sections) => sections.map((section) => ({
        ...section,
        entries: section.entries.filter((entry) => !seen.has(`${section.key}:${entry.id}`))
      })));
    }
  }

  markResourceSeen(resource: string, id: string): void {
    if (!id) return;
    const key = `${resource}:${id}`;
    const seen = this.readSeenNotifications();
    if (seen.has(key)) return;
    seen.add(key);
    this.persistSeen(seen);
    this.sections.update((sections) => sections.map((section) => section.key === resource
      ? { ...section, entries: section.entries.filter((entry) => entry.id !== id) }
      : section
    ));
    this.hasUnseen.update((value) => value && this.sections().some((section) => section.entries.length > 0));
    this.started = false;
  }

  activityFor(period: '24h' | '7d' | '30d' | '12m'): DashboardActivityPoint[] {
    const now = new Date();
    const values: { label: string; start: Date; end: Date }[] = [];

    if (period === '24h') {
      for (let index = 23; index >= 0; index -= 1) {
        const start = new Date(now);
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() - index);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        values.push({ label: start.toLocaleTimeString('fr-FR', { hour: '2-digit' }), start, end });
      }
    } else if (period === '12m') {
      for (let index = 11; index >= 0; index -= 1) {
        const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
        values.push({ label: start.toLocaleDateString('fr-FR', { month: 'short' }), start, end });
      }
    } else {
      const days = period === '7d' ? 7 : 30;
      for (let index = days - 1; index >= 0; index -= 1) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - index);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        values.push({
          label: period === '7d'
            ? start.toLocaleDateString('fr-FR', { weekday: 'short' })
            : start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          start,
          end
        });
      }
    }

    const rows = this.activityRows();
    const counts = values.map(({ start, end }) => rows.filter((row) => {
      const time = new Date(this.dateOf(row)).getTime();
      return Number.isFinite(time) && time >= start.getTime() && time < end.getTime();
    }).length);
    const max = Math.max(...counts, 1);
    const chartHeight = 190;
    const chartWidth = 1000;

    return values.map((bucket, index) => ({
      label: bucket.label,
      value: counts[index],
      x: values.length === 1 ? chartWidth / 2 : 36 + (index / (values.length - 1)) * (chartWidth - 50),
      y: chartHeight - (counts[index] / max) * chartHeight
    }));
  }

  private fetchRows(endpoint: string): Observable<{ items: Record<string, unknown>[]; total: number }> {
    return this.api.get<unknown>(endpoint, { limit: 100 }).pipe(
      map((response) => this.extractPage(response)),
      catchError(() => of({ items: [] as Record<string, unknown>[], total: 0 }))
    );
  }

  private buildSection(category: CategoryDef, rows: Record<string, unknown>[], total: number): ActivitySection {
    const seen = this.readSeenNotifications();
    const sorted = [...rows]
      .map((row) => ({ row, at: new Date(this.dateOf(row)).getTime() }))
      .sort((a, b) => b.at - a.at)
      .map((item) => item.row);
    const relevantRows = category.key === 'contacts'
      ? sorted.filter((row) => ['NEW', 'IN_PROGRESS'].includes(String(row['status'] ?? '').toUpperCase()))
      : sorted;

    return {
      key: category.key,
      label: category.label,
      icon: category.icon,
      link: category.link,
      entries: relevantRows
        .filter((row) => !seen.has(`${category.key}:${this.rowId(row)}`))
        .slice(0, 2)
        .map((row) => this.mapEntry(category, row)),
      total
    };
  }

  private countUnreadMessages(result: { items: Record<string, unknown>[]; total: number }): number {
    return result.items.filter((row) => ['NEW', 'IN_PROGRESS'].includes(String(row['status'] ?? '').toUpperCase())).length;
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
      id: this.rowId(row),
      initials: this.initials(name) || this.initials(category.label),
      name: name || category.label,
      detail,
      time: this.formatAge(this.dateOf(row)),
      status: rawStatus ? this.statusLabel(rawStatus) : undefined,
      statusTone: rawStatus ? this.statusTone(rawStatus) : 'neutral'
    };
  }

  private rowId(row: Record<string, unknown>): string {
    return String(row['id'] ?? row['_id'] ?? '');
  }

  private persistSeen(seen: Set<string>): void {
    try {
      localStorage.setItem(this.seenStorageKey, [...seen].join(','));
    } catch (error) {
      this.error.set('Impossible de mémoriser les notifications consultées.');
      console.error('Échec de mémorisation des notifications consultées', error);
    }
  }

  private readSeenNotifications(): Set<string> {
    if (typeof localStorage === 'undefined') return new Set<string>();
    try {
      const values = localStorage.getItem(this.seenStorageKey);
      return new Set((values ?? '').split(',').filter(Boolean));
    } catch (error) {
      this.error.set('Impossible de lire les notifications déjà consultées.');
      console.error('Échec de lecture des notifications consultées', error);
      return new Set<string>();
    }
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

  private extractPage(response: unknown): { items: Record<string, unknown>[]; total: number } {
    if (Array.isArray(response)) {
      const items = response.filter((item) => this.isRecord(item));
      return { items, total: items.length };
    }
    if (this.isRecord(response)) {
      const data = response['data'];
      if (Array.isArray(data)) {
        const items = data.filter((item) => this.isRecord(item));
        return { items, total: items.length };
      }
      if (this.isRecord(data) && Array.isArray(data['items'])) {
        const items = data['items'].filter((item) => this.isRecord(item));
        const pagination = this.isRecord(data['pagination']) ? data['pagination'] : null;
        const rawTotal = pagination?.['total'] ?? data['total'];
        return { items, total: typeof rawTotal === 'number' ? rawTotal : items.length };
      }
    }
    return { items: [], total: 0 };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}