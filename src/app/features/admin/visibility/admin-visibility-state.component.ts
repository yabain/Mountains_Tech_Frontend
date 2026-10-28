import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/http/api.service';

@Component({
  selector: 'app-admin-visibility-state',
  standalone: true,
  imports: [CommonModule],
  template: `<section class="res-page">
  <header class="admin-page-heading">
    <h2><i class="bi bi-eye" aria-hidden="true"></i> Visibilité du site</h2>
    <p>Visiteurs actifs en temps réel.</p>
  </header>

  <div class="visibility-actions">
    <button class="res-btn res-btn--outline" type="button" (click)="load(false)" [disabled]="loading()">Actualiser</button>
    <span class="res-count">{{ total() }} visiteur(s) actif(s)</span>
  </div>

  @if (loading()) {
    <div class="admin-state">Chargement de la visibilité…</div>
  } @else if (error()) {
    <div class="admin-state admin-state--error" role="alert">{{ error() }}</div>
  } @else {
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Visiteur</th>
            <th>Session</th>
            <th>Page actuelle</th>
            <th>Referer</th>
            <th>IP</th>
            <th>Dernière activité</th>
          </tr>
        </thead>
        <tbody>
          @for (v of visitors(); track v.visitorId) {
            <tr>
              <td>{{ v.visitorId }}</td>
              <td>{{ v.sessionId }}</td>
              <td>{{ v.page }}</td>
              <td>{{ v.referer }}</td>
              <td>{{ v.ip }}</td>
              <td>{{ v.lastSeen | date:'short' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }
</section>`,
  styleUrl: './admin-visibility-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminVisibilityStateComponent {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly visitors = signal<any[]>([]);
  readonly total = signal(0);

  constructor() {
    this.load(true);
  }

  load(fromInit: boolean): void {
    if (fromInit) this.loading.set(true);
    this.error.set('');
    this.api.get('/tracking/visitors').subscribe({
      next: (res: any) => {
        this.visitors.set(res?.data ?? []);
        this.total.set((res?.data ?? []).length);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les visiteurs.');
        this.loading.set(false);
      }
    });
  }
}
