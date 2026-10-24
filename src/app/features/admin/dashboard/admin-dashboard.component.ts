import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { DashboardActivityPoint, DashboardDataService, ActivitySection } from './dashboard-data.service';

type ChartPeriod = '24h' | '7d' | '30d' | '12m';

const PERIOD_LABELS: Record<ChartPeriod, string> = {
  '24h': 'Fréquentation · dernières 24 heures',
  '7d': 'Activité · 7 derniers jours',
  '30d': 'Activité · 30 derniers jours',
  '12m': 'Activité · 12 derniers mois'
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly dataService = inject(DashboardDataService);
  private readonly authService = inject(AuthService);

  readonly currentUser$ = this.authService.currentUser$;
  readonly loading = this.dataService.loading;
  readonly error = this.dataService.error;
  readonly sections = this.dataService.sections;
  readonly metrics = this.dataService.metrics;

  readonly period = signal<ChartPeriod>('24h');
  readonly currentDateTime = signal(new Date());
  readonly currentTimeLabel = computed(() => new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(this.currentDateTime()));
  readonly currentDateLabel = computed(() => new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(this.currentDateTime()));
  readonly categoryFilter = signal('all');
  readonly chart = computed(() => {
    const selectedPeriod = this.period();
    const points = this.dataService.activityFor(selectedPeriod);
    const max = Math.max(...points.map(({ value }) => value), 1);
    const total = points.reduce((sum, point) => sum + point.value, 0);
    const linePath = this.smoothPath(points);

    return {
      points,
      linePath,
      total,
      max,
      rangeLabel: PERIOD_LABELS[selectedPeriod],
      labelEvery: selectedPeriod === '24h' ? 2 : selectedPeriod === '7d' ? 1 : selectedPeriod === '30d' ? 5 : 1
    };
  });
  readonly filteredSections = computed<ActivitySection[]>(() => {
    const key = this.categoryFilter();
    return key === 'all' ? this.sections() : this.sections().filter((section) => section.key === key);
  });

  constructor() {
    this.dataService.load();
    interval(1_000).pipe(takeUntilDestroyed()).subscribe(() => this.currentDateTime.set(new Date()));
    // Vide la liste des dernières actions après 1 heure (3,6 millions de ms)
    setTimeout(() => {
      this.dataService.markNotificationsSeen(false);
    }, 3_600_000);
  }

  categories(): { key: string; label: string }[] {
    return this.dataService.categories().map(({ key, label }) => ({ key, label }));
  }

  sectionTotal(key: string): number {
    return this.sections().find((section) => section.key === key)?.total ?? 0;
  }

  firstName(user: { name?: string } | null): string {
    const name = user?.name ? user.name.trim().split(/\s+/)[0] : '';
    return name || 'votre espace';
  }

  setPeriod(period: string): void {
    if (period === '24h' || period === '7d' || period === '30d' || period === '12m') {
      this.period.set(period);
    }
  }

  setCategoryFilter(category: string): void {
    this.categoryFilter.set(category);
  }

  exportReport(): void {
    const header = ['Catégorie', 'Nom', 'Détail', 'Statut', 'Date'];
    const rows: string[][] = this.sections().flatMap((section) =>
      section.entries.map((entry) => [section.label, entry.name, entry.detail, entry.status ?? '', entry.time])
    );
    const csv = [header, ...rows]
      .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'rapport-activites.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private smoothPath(points: DashboardActivityPoint[]): string {
    if (!points.length) {
      return '';
    }
    const [first, ...rest] = points;
    return rest.reduce((path, point, index) => {
      const previous = points[index];
      const middleX = (previous.x + point.x) / 2;
      return `${path} Q ${middleX} ${previous.y + 20}, ${point.x} ${point.y + 20}`;
    }, `M ${first.x} ${first.y + 20}`);
  }
}
