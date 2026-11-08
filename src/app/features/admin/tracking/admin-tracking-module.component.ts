import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/http/api.service';

type TrackingRange = '24h' | '7d' | '30d' | '12m';

interface TrackingMetric {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface TrackedPage {
  path: string;
  views: number;
}

interface ActivePage {
  path: string;
  visitors: number;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  label: string;
}

interface TrackingPayload {
  metrics: TrackingMetric[];
  pages: TrackedPage[];
}

@Component({
  selector: 'app-admin-tracking-module',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="tracking-page">
      <header class="tracking-heading">
        <div>
          <h1><i class="bi bi-graph-up-arrow" aria-hidden="true"></i> Tracking</h1>
          <p>Suivi détaillé de la fréquentation et des pages les plus consultées.</p>
        </div>
        <button class="tracking-refresh" type="button" (click)="load()" [disabled]="loading()">
          <i class="bi bi-arrow-clockwise" [class.is-spinning]="loading()" aria-hidden="true"></i>
          Actualiser
        </button>
      </header>

      @if (error()) {
        <p class="tracking-error" role="alert">{{ error() }}</p>
      }

      <section class="tracking-stats" aria-label="Indicateurs de fréquentation">
        <article class="tracking-stat">
          <span class="tracking-stat-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
          <span class="tracking-stat-copy">
            <strong>{{ totalVisitors | number }}</strong>
            <span>Visiteurs uniques</span>
          </span>
        </article>
        <article class="tracking-stat">
          <span class="tracking-stat-icon"><i class="bi bi-graph-up" aria-hidden="true"></i></span>
          <span class="tracking-stat-copy">
            <strong>{{ totalViews | number }}</strong>
            <span>Total vues pages</span>
          </span>
        </article>
        <article class="tracking-stat">
          <span class="tracking-stat-icon"><i class="bi bi-fire" aria-hidden="true"></i></span>
          <span class="tracking-stat-copy">
            <strong>{{ todayVisitors | number }}</strong>
            <span>Aujourd’hui (visiteurs)</span>
          </span>
        </article>
        <article class="tracking-stat">
          <span class="tracking-stat-icon"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i></span>
          <span class="tracking-stat-copy">
            <strong>{{ todayViews | number }}</strong>
            <span>Aujourd’hui (vues de pages)</span>
          </span>
        </article>
      </section>

      <section class="tracking-panel tracking-chart-panel" aria-labelledby="tracking-chart-title">
        <div class="tracking-panel-heading">
          <h2 id="tracking-chart-title">Fréquentation</h2>
          <div class="tracking-ranges" role="group" aria-label="Période du graphique">
            @for (range of ranges; track range.id) {
              <button
                type="button"
                [class.is-active]="selectedRange() === range.id"
                [attr.aria-pressed]="selectedRange() === range.id"
                (click)="selectedRange.set(range.id)"
              >
                {{ range.label }}
              </button>
            }
          </div>
        </div>

        @if (loading() && metrics().length === 0) {
          <div class="tracking-chart-empty" role="status">Chargement des données de fréquentation…</div>
        } @else if (chartPoints.length === 0) {
          <div class="tracking-chart-empty">Aucune donnée de fréquentation pour cette période.</div>
        } @else {
          <div class="tracking-chart-wrap">
            <svg class="tracking-chart" viewBox="0 0 1000 220" role="img" aria-label="Évolution du nombre de pages vues">
              @for (tick of chartTicks; track tick.value) {
                <line x1="48" [attr.y1]="tick.y" x2="990" [attr.y2]="tick.y" class="tracking-grid-line" />
                <text x="38" [attr.y]="tick.y + 4" text-anchor="end" class="tracking-axis-label">{{ tick.value }}</text>
              }
              @if (chartPoints.length > 1) {
                <path [attr.d]="chartPath" class="tracking-chart-line" />
              }
              @for (point of chartPoints; track point.label) {
                <circle [attr.cx]="point.x" [attr.cy]="point.y" r="3.5" class="tracking-chart-point">
                  <title>{{ point.label }} : {{ point.value }} vues</title>
                </circle>
              }
              @for (label of chartLabels; track label.text) {
                <text [attr.x]="label.x" y="210" text-anchor="middle" class="tracking-axis-label">{{ label.text }}</text>
              }
            </svg>
          </div>
        }
      </section>

      <section class="tracking-panel tracking-pages-panel" aria-labelledby="tracking-pages-title">
        <h2 id="tracking-pages-title">
          {{ pages().length ? 'Pages les plus visitées' : 'Pages consultées par les visiteurs actifs' }}
        </h2>

        @if (loading() && pages().length === 0 && activePages.length === 0) {
          <p class="tracking-table-state" role="status">Chargement des pages…</p>
        } @else if (pages().length > 0) {
          <div class="tracking-table-scroll">
            <table>
              <thead><tr><th>Page</th><th class="tracking-number">Vues</th></tr></thead>
              <tbody>
                @for (page of pages(); track page.path) {
                  <tr><td><span class="tracking-path">{{ page.path }}</span></td><td class="tracking-number">{{ page.views | number }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (activePages.length > 0) {
          <div class="tracking-table-scroll">
            <table>
              <thead><tr><th>Page</th><th class="tracking-number">Visiteurs actifs</th></tr></thead>
              <tbody>
                @for (page of activePages; track page.path) {
                  <tr><td><span class="tracking-path">{{ page.path }}</span></td><td class="tracking-number">{{ page.visitors | number }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="tracking-table-state">Aucune page consultée à afficher.</p>
        }
      </section>

      <footer class="tracking-footer">
        <span>Copyright © 2026 Mountains Tech · Bangangté, Cameroun</span>
        <span>Développé par <a href="https://yaba-in.com" target="_blank" rel="noopener">Yaba-In</a></span>
      </footer>
    </main>
  `,
  styleUrl: './admin-tracking-module.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTrackingModuleComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly metrics = signal<TrackingMetric[]>([]);
  readonly visitors = signal<Record<string, unknown>[]>([]);
  readonly pages = signal<TrackedPage[]>([]);
  readonly selectedRange = signal<TrackingRange>('24h');
  readonly ranges: { id: TrackingRange; label: string }[] = [
    { id: '24h', label: '24 h' },
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: '12m', label: '12 mois' }
  ];

  constructor() {
    this.load();
  }

  get totalVisitors(): number {
    return this.metrics().reduce((sum, row) => sum + row.uniqueVisitors, 0);
  }

  get totalViews(): number {
    return this.metrics().reduce((sum, row) => sum + row.views, 0);
  }

  get todayVisitors(): number {
    return this.todayMetric()?.uniqueVisitors ?? 0;
  }

  get todayViews(): number {
    return this.todayMetric()?.views ?? 0;
  }

  get activePages(): ActivePage[] {
    const byPage = new Map<string, number>();
    this.visitors().forEach((visitor) => {
      const path = visitor['page'];
      if (typeof path === 'string' && path.trim()) {
        byPage.set(path, (byPage.get(path) ?? 0) + 1);
      }
    });
    return [...byPage.entries()]
      .map(([path, visitors]) => ({ path, visitors }))
      .sort((left, right) => right.visitors - left.visitors)
      .slice(0, 10);
  }

  get chartPoints(): ChartPoint[] {
    const now = new Date();
    const windowMs = this.rangeDuration();
    const visible = this.metrics()
      .map((metric) => ({ metric, at: this.metricDate(metric.date) }))
      .filter((entry) => entry.at && now.getTime() - entry.at.getTime() <= windowMs && entry.at.getTime() <= now.getTime())
      .sort((left, right) => left.at!.getTime() - right.at!.getTime());
    if (visible.length === 0) return [];

    const max = this.chartAxisMaximum(Math.max(1, ...visible.map(({ metric }) => metric.views)));
    const chartWidth = 920;
    return visible.map(({ metric, at }, index) => ({
      x: visible.length === 1 ? 519 : 54 + (chartWidth * index) / (visible.length - 1),
      y: 180 - (metric.views / max) * 145,
      value: metric.views,
      label: this.formatChartDate(at!)
    }));
  }

  get chartPath(): string {
    return this.chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  }

  get chartTicks(): { value: number; y: number }[] {
    const max = Math.max(1, ...this.chartPoints.map((point) => point.value));
    const step = this.niceStep(max);
    const top = step * 4;
    return Array.from({ length: 5 }, (_, index) => {
      const value = top - step * index;
      return { value, y: 35 + (145 * index) / 4 };
    });
  }

  get chartLabels(): { text: string; x: number }[] {
    const points = this.chartPoints;
    if (points.length <= 5) return points.map((point) => ({ text: point.label, x: point.x }));
    return [0, Math.round((points.length - 1) / 4), Math.round((points.length - 1) / 2), Math.round(3 * (points.length - 1) / 4), points.length - 1]
      .map((index) => ({ text: points[index].label, x: points[index].x }));
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    let remaining = 2;
    const finish = (): void => {
      remaining -= 1;
      if (remaining === 0) this.loading.set(false);
    };

    this.api.get<unknown>('/tracking')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const payload = this.normalizeTracking(response);
          this.metrics.set(payload.metrics);
          this.pages.set(payload.pages);
          finish();
        },
        error: () => {
          this.error.set('Impossible de charger les métriques de fréquentation.');
          this.metrics.set([]);
          this.pages.set([]);
          finish();
        }
      });

    this.api.get<unknown>('/tracking/visitors')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.visitors.set(this.normalizeVisitors(response));
          finish();
        },
        error: () => {
          this.error.set(this.error()
            ? `${this.error()} Impossible de charger les pages des visiteurs actifs.`
            : 'Impossible de charger les pages des visiteurs actifs.');
          this.visitors.set([]);
          finish();
        }
      });
  }

  private todayMetric(): TrackingMetric | undefined {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return this.metrics().find((metric) => metric.date.slice(0, 10) === key);
  }

  private rangeDuration(): number {
    const durations: Record<TrackingRange, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '12m': 365 * 24 * 60 * 60 * 1000
    };
    return durations[this.selectedRange()];
  }

  private metricDate(value: string): Date | null {
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatChartDate(date: Date): string {
    if (this.selectedRange() === '24h' && this.metrics().some((metric) => metric.date.includes('T'))) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  private niceStep(max: number): number {
    const roughStep = max / 4;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
  }

  private chartAxisMaximum(max: number): number {
    return this.niceStep(max) * 4;
  }

  private normalizeTracking(response: unknown): TrackingPayload {
    const root = this.asRecord(response);
    const data = this.asRecord(root?.['data']) ?? root;
    const rawMetrics = Array.isArray(root?.['data']) ? root['data'] : data?.['metrics'];
    const metrics = Array.isArray(rawMetrics)
      ? rawMetrics.map((row) => this.normalizeMetric(row)).filter((row): row is TrackingMetric => row !== null)
      : [];
    const rawPages = data?.['topPages'] ?? data?.['popularPages'] ?? data?.['pages'];
    const pages = Array.isArray(rawPages)
      ? rawPages.map((row) => this.normalizePage(row)).filter((row): row is TrackedPage => row !== null)
        .sort((left, right) => right.views - left.views)
        .slice(0, 10)
      : [];
    return { metrics, pages };
  }

  private normalizeMetric(value: unknown): TrackingMetric | null {
    const row = this.asRecord(value);
    const date = row?.['date'];
    if (typeof date !== 'string' || !date.trim()) return null;
    return {
      date,
      views: this.nonNegativeNumber(row?.['views']),
      uniqueVisitors: this.nonNegativeNumber(row?.['uniqueVisitors'])
    };
  }

  private normalizePage(value: unknown): TrackedPage | null {
    const row = this.asRecord(value);
    const path = row?.['path'] ?? row?.['page'];
    const views = row?.['views'] ?? row?.['count'];
    if (typeof path !== 'string' || !path.trim() || typeof views !== 'number' || !Number.isFinite(views)) return null;
    return { path, views: Math.max(0, views) };
  }

  private normalizeVisitors(response: unknown): Record<string, unknown>[] {
    const root = this.asRecord(response);
    const values = Array.isArray(root?.['data']) ? root['data'] : [];
    return values.map((value) => this.asRecord(value)).filter((row): row is Record<string, unknown> => row !== null);
  }

  private nonNegativeNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }
}
