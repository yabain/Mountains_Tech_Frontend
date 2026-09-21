import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { AuthService } from '../../../core/auth/services/auth.service';
import { normalizeRole } from '../admin-navigation';

interface DashboardMetric {
  label: string;
  value: unknown;
  icon: string;
  tone: 'blue' | 'green' | 'yellow' | 'cyan';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [KeyValuePipe, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  readonly dashboard = signal<Record<string, unknown> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selectedTimeRange = signal('30days');
  readonly timeRanges = [
    { value: '7days', label: '7 jours' },
    { value: '30days', label: '30 jours' },
    { value: '90days', label: '90 jours' },
    { value: 'year', label: '1 an' }
  ];

  constructor() {
    this.api.get<unknown>(API_ROUTES.admin.dashboard).subscribe({
      next: (response) => {
        this.dashboard.set(this.toRecord(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Les données du dashboard sont indisponibles.');
        this.loading.set(false);
      }
    });
  }

  isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  isScalar(value: unknown): boolean {
    return value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value);
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  roleLabel(): string {
    const role = normalizeRole(this.authService.currentUser$.value?.role ?? '');
    return role === 'SUPER_ADMIN' ? 'Super administrateur' : role === 'ADMIN' ? 'Administrateur' : role === 'EDITOR' ? 'Éditeur' : 'Communication';
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

  collection(name: string): Record<string, unknown>[] {
    const source = this.dashboard();
    if (!source) {
      return [];
    }
    const value = source[name] ?? this.asRecord(source['data'])?.[name];
    return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => this.isRecord(item)) : [];
  }

  recordEntries(value: Record<string, unknown>): [string, unknown][] {
    return Object.entries(value).slice(0, 4);
  }

  onTimeRangeChange(value: string): void {
    this.selectedTimeRange.set(value);
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
