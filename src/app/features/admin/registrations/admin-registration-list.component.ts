import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/http/api.service';
import { adminDynamicRoutes } from '../../../core/constants/api-routes';

type RegistrationKind = 'event' | 'hackathon';
type RegistrationRow = Record<string, unknown>;

interface RegistrationPage {
  items: RegistrationRow[];
  total: number;
  pages: number;
}

@Component({
  selector: 'app-admin-registration-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-registration-list.component.html',
  styleUrls: ['../resource/admin-editor.scss', './admin-registration-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRegistrationListComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly kind: RegistrationKind =
    this.route.snapshot.data['registrationType'] === 'hackathon' ? 'hackathon' : 'event';
  readonly itemId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly title = this.kind === 'event' ? 'Inscriptions à l’événement' : 'Inscriptions au hackathon';
  readonly loading = signal(true);
  readonly reloading = signal(false);
  readonly error = signal('');
  readonly rows = signal<RegistrationRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly search = signal('');
  readonly columns = computed(() => this.kind === 'event'
    ? [
        { key: 'attendee', label: 'Participant' },
        { key: 'email', label: 'E-mail' },
        { key: 'phone', label: 'Téléphone' },
        { key: 'organization', label: 'Organisation' },
        { key: 'status', label: 'Statut' },
        { key: 'createdAt', label: 'Inscrit le' }
      ]
    : [
        { key: 'teamName', label: 'Équipe' },
        { key: 'leaderName', label: 'Responsable' },
        { key: 'leaderEmail', label: 'E-mail' },
        { key: 'membersCount', label: 'Membres' },
        { key: 'status', label: 'Statut' },
        { key: 'createdAt', label: 'Inscrite le' }
      ]);

  constructor() {
    if (!this.itemId) {
      this.error.set('Identifiant manquant.');
      this.loading.set(false);
      return;
    }
    this.load();
  }

  searchChanged(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load(true);
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((current) => current - 1);
    this.load(true);
  }

  nextPage(): void {
    if (this.page() >= this.pages()) return;
    this.page.update((current) => current + 1);
    this.load(true);
  }

  back(): void {
    void this.router.navigate([this.kind === 'event' ? '/dashboard/events' : '/dashboard/hackathons']);
  }

  cell(row: RegistrationRow, key: string): string {
    switch (key) {
      case 'attendee':
        return [row['firstName'], row['lastName']].filter(Boolean).join(' ') || '—';
      case 'leaderName':
        return this.leaderField(row, 'name')
          || [row['firstName'], row['lastName']].filter(Boolean).join(' ')
          || '—';
      case 'leaderEmail':
        return this.leaderField(row, 'email') || this.text(row['email']);
      case 'membersCount':
        return Array.isArray(row['members']) ? String(row['members'].length + 1) : '—';
      case 'createdAt':
        return this.formatDate(row['createdAt'] ?? row['registeredAt'] ?? row['submittedAt']);
      default:
        return this.text(row[key]);
    }
  }

  private load(soft = false): void {
    if (soft) this.reloading.set(true);
    else this.loading.set(true);
    this.error.set('');

    const endpoint = this.kind === 'event'
      ? adminDynamicRoutes.eventRegistrations(encodeURIComponent(this.itemId))
      : adminDynamicRoutes.hackathonTeams(encodeURIComponent(this.itemId));
    this.api.get<unknown>(endpoint, {
      page: this.page(),
      limit: 20,
      ...(this.search().trim() ? { search: this.search().trim() } : {})
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const data = this.extract(response);
        this.rows.set(data.items);
        this.total.set(data.total);
        this.pages.set(Math.max(data.pages, 1));
        this.loading.set(false);
        this.reloading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les inscriptions pour le moment.');
        this.loading.set(false);
        this.reloading.set(false);
      }
    });
  }

  private extract(response: unknown): RegistrationPage {
    if (!response || typeof response !== 'object') return { items: [], total: 0, pages: 1 };
    const outer = response as Record<string, unknown>;
    const data = outer['data'] && typeof outer['data'] === 'object'
      ? outer['data'] as Record<string, unknown>
      : outer;
    const candidates = this.kind === 'event'
      ? [data['items'], data['registrations'], outer['items'], outer['registrations']]
      : [data['items'], data['teams'], outer['items'], outer['teams']];
    const items = candidates.find(Array.isArray) as unknown[] | undefined;
    const rows = (items ?? []).filter(this.isRecord);
    const pagination = data['pagination'] && typeof data['pagination'] === 'object'
      ? data['pagination'] as Record<string, unknown>
      : null;
    const totalValue = pagination?.['total'] ?? data['total'];
    const pagesValue = pagination?.['pages'] ?? data['pages'];
    return {
      items: rows,
      total: typeof totalValue === 'number' ? totalValue : rows.length,
      pages: typeof pagesValue === 'number'
        ? pagesValue
        : Math.max(1, Math.ceil((typeof totalValue === 'number' ? totalValue : rows.length) / 20))
    };
  }

  private leaderField(row: RegistrationRow, field: string): string {
    const leader = row['leader'];
    if (!leader || typeof leader !== 'object') return '';
    return this.text((leader as Record<string, unknown>)[field], '');
  }

  private text(value: unknown, fallback = '—'): string {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'object') return fallback;
    return String(value);
  }

  private formatDate(value: unknown): string {
    if (!value) return '—';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private isRecord(value: unknown): value is RegistrationRow {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
