import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/http/api.service';

@Component({
  selector: 'app-admin-tracking-module',
  standalone: true,
  imports: [CommonModule],
  template: `<section class="res-page">
  <h2><i class="bi bi-graph-up" aria-hidden="true"></i> Tracking</h2>
  @if (loading()) {
    <div class="admin-state">Chargement des métriques…</div>
  } @else if (error()) {
    <div class="admin-state admin-state--error" role="alert">{{ error() }}</div>
  } @else {
    <div class="tracking-grid">
      <div class="tracking-card">
        <h3>Métriques (30 jours)</h3>
        <table class="admin-table">
          <thead><tr><th>Date</th><th>Vues</th><th>Visiteurs uniques</th></tr></thead>
          <tbody>
            @for (row of metrics(); track row.date) {
              <tr><td>{{ row.date }}</td><td>{{ row.views }}</td><td>{{ row.uniqueVisitors }}</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="tracking-card">
        <h3>Visiteurs actifs (5 min)</h3>
        <ul>
          @for (v of visitors(); track v.visitorId) {
            <li>{{ v.page }} — {{ v.visitorId }} — {{ v.ip }}</li>
          }
        </ul>
      </div>
    </div>
  }
</section>`,
  styleUrl: './admin-tracking-module.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTrackingModuleComponent {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly metrics = signal<any[]>([]);
  readonly visitors = signal<any[]>([]);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get('/tracking').subscribe({
      next: (res: any) => this.metrics.set(res?.data ?? []),
      error: () => this.error.set('Impossible de charger les métriques.')
    });
    this.api.get('/tracking/visitors').subscribe({
      next: (res: any) => this.visitors.set(res?.data ?? []),
      error: () => this.error.set('Impossible de charger les visiteurs.')
    });
    this.loading.set(false);
  }
}
