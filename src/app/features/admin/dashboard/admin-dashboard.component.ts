import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { AuthService } from '../../../core/auth/services/auth.service';
import { permissionsForUser, ADMIN_NAV_ITEMS } from '../admin-navigation';

interface DashboardMetric {
  label: string;
  value: unknown;
  icon: string;
  tone: 'blue' | 'green' | 'yellow' | 'cyan';
}

interface PreviewItem {
  title: string;
  subtitle: string;
  status?: string;
  createdAt?: string;
}

interface PreviewSection {
  id: string;
  title: string;
  icon: string;
  tone: 'blue' | 'green' | 'yellow' | 'cyan' | 'purple';
  link: string;
  items: PreviewItem[];
  count: number;
  kind: 'request' | 'content';
}

const REQUEST_PREVIEWS = [
  {
    id: 'memberApplications',
    title: 'Demandes d’adhésion',
    icon: 'bi-person-badge',
    tone: 'purple' as const,
    link: '/dashboard/members/applications',
    endpoint: API_ROUTES.admin.memberApplications,
    params: { status: 'PENDING', limit: 5 }
  },
  {
    id: 'contacts',
    title: 'Nouveaux contacts',
    icon: 'bi-envelope-open',
    tone: 'green' as const,
    link: '/dashboard/contacts',
    endpoint: API_ROUTES.admin.contacts,
    params: { status: 'NEW', limit: 5 }
  },
  {
    id: 'hackathonTeams',
    title: 'Équipes de hackathon en attente',
    icon: 'bi-people',
    tone: 'yellow' as const,
    link: '/dashboard/hackathons',
    endpoint: '',
    params: {}
  }
];

const CONTENT_PREVIEWS = [
  {
    id: 'events',
    title: 'Événements récents',
    icon: 'bi-calendar-event',
    tone: 'blue' as const,
    link: '/dashboard/events',
    endpoint: API_ROUTES.admin.events,
    params: { status: 'PUBLISHED', limit: 5 }
  },
  {
    id: 'activities',
    title: 'Activités récentes',
    icon: 'bi-lightning-charge',
    tone: 'cyan' as const,
    link: '/dashboard/activities',
    endpoint: API_ROUTES.admin.activities,
    params: { status: 'PUBLISHED', limit: 5 }
  },
  {
    id: 'projects',
    title: 'Projets récents',
    icon: 'bi-kanban',
    tone: 'purple' as const,
    link: '/dashboard/projects',
    endpoint: API_ROUTES.admin.projects,
    params: { status: 'PUBLISHED', limit: 5 }
  },
  {
    id: 'partners',
    title: 'Partenaires',
    icon: 'bi-building',
    tone: 'green' as const,
    link: '/dashboard/partners',
    endpoint: API_ROUTES.admin.partners,
    params: {}
  }
];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  providers: [DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  readonly dashboard = signal<Record<string, unknown> | null>(null);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal('');
  readonly requestPreviews = signal<PreviewSection[]>([]);
  readonly contentPreviews = signal<PreviewSection[]>([]);

  constructor() {
    this.load();
  }

  refresh(): void {
    this.refreshing.set(true);
    this.load();
  }

  load(): void {
    this.api.get<unknown>(API_ROUTES.admin.dashboard).subscribe({
      next: (response) => {
        this.dashboard.set(this.toRecord(response));
        this.loading.set(false);
        this.refreshing.set(false);
        this.loadPreviews();
      },
      error: () => {
        this.error.set('Les données du dashboard sont indisponibles.');
        this.loading.set(false);
        this.refreshing.set(false);
      }
    });
  }

  isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  roleLabel(): string {
    const role = this.authService.currentUser$.value?.role ?? '';
    const normalized = role.toUpperCase();
    if (normalized.includes('SUPER')) {
      return 'Super administrateur';
    }
    if (normalized.includes('ADMIN')) {
      return 'Administrateur';
    }
    if (normalized.includes('EDITOR')) {
      return 'Éditeur';
    }
    return 'Communication';
  }

  metrics(): DashboardMetric[] {
    const source = this.firstRecord(['stats', 'kpis', 'metrics']) ?? this.dashboard() ?? {};
    const values = Object.entries(source).filter(([, value]) => this.isPrimitive(value)).slice(0, 4);
    const defaults: DashboardMetric[] = [
      { label: 'Utilisateurs', value: '-', icon: 'bi-people', tone: 'blue' },
      { label: 'Membres', value: '-', icon: 'bi-person-badge', tone: 'green' },
      { label: 'Événements', value: '-', icon: 'bi-calendar-event', tone: 'yellow' },
      { label: 'Projets', value: '-', icon: 'bi-kanban', tone: 'cyan' }
    ];
    return values.length
      ? values.map(([label, value], index) => ({ ...defaults[index % defaults.length], label: this.humanize(label), value }))
      : defaults;
  }

  quickActions(): { label: string; route: string; icon: string }[] {
    const permissions = permissionsForUser(this.authService.currentUser$.value);
    return ADMIN_NAV_ITEMS
      .filter((item) => ['members', 'events', 'projects', 'activities', 'hackathons', 'partners', 'announcements', 'media'].includes(item.permission))
      .filter((item) => permissions.includes(item.permission))
      .map((item) => ({ label: 'Gérer ' + item.label.toLowerCase(), route: item.route, icon: item.icon }));
  }

  statusClass(status: unknown): string {
    const label = String(status ?? '').toLowerCase();
    if (['approved', 'published', 'active', 'resolved', 'subscribed'].includes(label)) {
      return 'dash-badge dash-badge--success';
    }
    if (['pending', 'new'].includes(label)) {
      return 'dash-badge dash-badge--pending';
    }
    if (['rejected', 'spam', 'archived', 'inactive', 'unsubscribed'].includes(label)) {
      return 'dash-badge dash-badge--danger';
    }
    return 'dash-badge dash-badge--neutral';
  }

  private loadPreviews(): void {
    const requestObs = REQUEST_PREVIEWS
      .filter((section) => section.endpoint)
      .map((section) => this.api.get<unknown>(section.endpoint, section.params));

    forkJoin(requestObs).subscribe({
      next: ([applications, contacts]) => {
        const previews: PreviewSection[] = [];
        const appRows = this.extractItems(applications);
        previews.push({
          id: 'memberApplications',
          title: REQUEST_PREVIEWS[0].title,
          icon: REQUEST_PREVIEWS[0].icon,
          tone: REQUEST_PREVIEWS[0].tone,
          link: REQUEST_PREVIEWS[0].link,
          items: this.mapItems('memberApplications', appRows),
          count: appRows.length,
          kind: 'request'
        });

        const contactRows = this.extractItems(contacts);
        previews.push({
          id: 'contacts',
          title: REQUEST_PREVIEWS[1].title,
          icon: REQUEST_PREVIEWS[1].icon,
          tone: REQUEST_PREVIEWS[1].tone,
          link: REQUEST_PREVIEWS[1].link,
          items: this.mapItems('contacts', contactRows),
          count: contactRows.length,
          kind: 'request'
        });
        this.requestPreviews.set(previews);
      },
      error: () => {
        /* les aperçus restent vides en cas d’erreur */
      }
    });

    const contentObs = CONTENT_PREVIEWS.map((section) => this.api.get<unknown>(section.endpoint, section.params));
    forkJoin(contentObs).subscribe({
      next: ([events, activities, projects, partners]) => {
        const sections: PreviewSection[] = [];
        for (let i = 0; i < CONTENT_PREVIEWS.length; i++) {
          const def = CONTENT_PREVIEWS[i];
          const responses = [events, activities, projects, partners];
          const rows = this.extractItems(responses[i]);
          sections.push({
            id: def.id,
            title: def.title,
            icon: def.icon,
            tone: def.tone,
            link: def.link,
            items: this.mapItems(def.id, rows),
            count: rows.length,
            kind: 'content'
          });
        }
        this.contentPreviews.set(sections);
        this.loadTeamsPreview();
      },
      error: () => {
        /* les aperçus restent vides en cas d’erreur */
      }
    });
  }

  private loadTeamsPreview(): void {
    this.api.get<unknown>(API_ROUTES.admin.hackathons, { status: 'PUBLISHED', limit: 1 }).subscribe({
      next: (hackathons) => {
        const rows = this.extractItems(hackathons);
        const latest = rows[0];
        if (!latest) {
          this.pushTeamPreview([]);
          return;
        }
        const id = String(latest['id'] ?? latest['_id'] ?? '');
        if (!id) {
          this.pushTeamPreview([]);
          return;
        }
        this.api.get<unknown>(adminDynamicRoutes.hackathonTeams(id), { status: 'PENDING', limit: 5 }).subscribe({
          next: (teams) => this.pushTeamPreview(this.extractItems(teams)),
          error: () => this.pushTeamPreview([])
        });
      },
      error: () => this.pushTeamPreview([])
    });
  }

  private pushTeamPreview(rows: Record<string, unknown>[]): void {
    const current = this.requestPreviews();
    const others = current.filter((section) => section.id !== 'hackathonTeams');
    others.push({
      id: 'hackathonTeams',
      title: REQUEST_PREVIEWS[2].title,
      icon: REQUEST_PREVIEWS[2].icon,
      tone: REQUEST_PREVIEWS[2].tone,
      link: REQUEST_PREVIEWS[2].link,
      items: this.mapItems('hackathonTeams', rows),
      count: rows.length,
      kind: 'request'
    });
    this.requestPreviews.set(others);
  }

  private mapItems(key: string, rows: Record<string, unknown>[]): PreviewItem[] {
    return rows.slice(0, 5).map((row) => {
      const value = (field: string): string => {
        const v = row[field];
        return v === null || v === undefined ? '' : String(v);
      };
      switch (key) {
        case 'memberApplications':
          return {
            title: value('companyName') || 'Entreprise', subtitle: value('representativeName') || value('representativeEmail'), status: value('status'), createdAt: value('createdAt')
          };
        case 'contacts':
          return {
            title: value('name'), subtitle: value('subject'), status: value('status'), createdAt: value('createdAt')
          };
        case 'hackathonTeams':
          return {
            title: value('teamName') || value('name'), subtitle: value('hackathonId'), status: value('status'), createdAt: value('createdAt')
          };
        case 'partners':
          return {
            title: value('name'), subtitle: value('type'), status: value('status'), createdAt: value('createdAt')
          };
        default:
          return {
            title: value('title') || value('name'),
            subtitle: value('category') || value('location') || value('excerpt') || value('description') || '',
            status: value('status'),
            createdAt: value('createdAt') || value('startAt') || value('startDate')
          };
      }
    });
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

  private toRecord(response: unknown): Record<string, unknown> {
    if (this.isRecord(response) && this.isRecord(response['data'])) {
      return response['data'];
    }

    return this.isRecord(response) ? response : {};
  }

  private firstRecord(names: string[]): Record<string, unknown> | null {
    const source = this.dashboard();
    for (const name of names) {
      const candidate = source ? source[name] : undefined;
      if (this.isRecord(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private isPrimitive(value: unknown): boolean {
    return ['string', 'number', 'boolean'].includes(typeof value);
  }

  private humanize(value: string): string {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
  }
}