import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { DashboardDataService, ActivitySection } from './dashboard-data.service';

interface BarDatum {
  day: number;
  current: number;
  prev: number;
  currentHeight: number;
  prevHeight: number;
  isYellow: boolean;
}

const CURRENT_SERIES = [230, 310, 280, 360, 295, 330, 280, 370, 440, 380, 425, 320, 430, 510, 440, 560, 405, 490, 530, 620, 470, 580, 680, 570, 620, 780, 650, 740, 640, 720];
const PREVIOUS_SERIES = [180, 225, 210, 240, 200, 250, 220, 290, 260, 230, 270, 240, 310, 280, 320, 260, 350, 310, 360, 290, 370, 340, 320, 390, 350, 400, 370, 420, 380, 430];
const PERIOD_LABELS: Record<string, string> = {
  '7': '24 – 30 septembre 2026',
  '30': '1 – 30 septembre 2026',
  '90': '1 juillet – 30 septembre 2026'
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

  readonly period = signal<'7' | '30' | '90'>('30');
  readonly categoryFilter = signal('all');

  constructor() {
    this.dataService.load();
  }

  readonly chart = computed(() => {
    const count = Number(this.period());
    const current = CURRENT_SERIES.slice(-count);
    const previous = PREVIOUS_SERIES.slice(-count);
    const max = Math.max(...current, ...previous);
    const yellowIndex = count === 30 ? 18 : -1;

    return {
      rangeLabel: PERIOD_LABELS[this.period()],
      total: current.reduce((sum, value) => sum + value, 0),
      prevTotal: previous.reduce((sum, value) => sum + value, 0),
      bars: current.map((value, index) => ({
        day: index + 1,
        current: value,
        prev: previous[index] ?? 0,
        currentHeight: Math.max(2, Math.round((value / max) * 100)),
        prevHeight: Math.max(2, Math.round(((previous[index] ?? 0) / max) * 100)),
        isYellow: index === yellowIndex
      }))
    };
  });

  readonly trend = computed(() => {
    const { total, prevTotal } = this.chart();
    if (!prevTotal) {
      return '+0 %';
    }
    const ratio = ((total - prevTotal) / prevTotal) * 100;
    const rounded = Math.round(Math.abs(ratio) * 10) / 10;
    return `${ratio >= 0 ? '+' : '−'}${rounded.toFixed(1).replace('-', '')} %`;
  });

  readonly filteredSections = computed<ActivitySection[]>(() => {
    const key = this.categoryFilter();
    if (key === 'all') {
      return this.sections();
    }
    return this.sections().filter((section) => section.key === key);
  });

  categories(): { key: string; label: string }[] {
    return this.dataService.categories().map(({ key, label }) => ({ key, label }));
  }

  firstName(user: { name?: string } | null): string {
    const name = user?.name ? user.name.trim().split(/\s+/)[0] : '';
    return name || 'Lionel';
  }

  setPeriod(period: string): void {
    if (period === '7' || period === '30' || period === '90') {
      this.period.set(period);
    }
  }

  setCategoryFilter(category: string): void {
    this.categoryFilter.set(category);
  }

  exportReport(): void {
    const header = ['Catégorie', 'Nom', 'Détail', 'Statut', 'Humain'];
    const rows: string[][] = this.sections().flatMap((section) =>
      section.entries.map((entry) => [
        section.label,
        entry.name,
        entry.detail,
        entry.status ?? '',
        entry.time
      ])
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
}