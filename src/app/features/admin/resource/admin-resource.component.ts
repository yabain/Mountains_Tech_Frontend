import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { API_ROUTES } from '../../../core/constants/api-routes';

type AdminEndpoint = keyof typeof API_ROUTES.admin;

@Component({
  selector: 'app-admin-resource',
  standalone: true,
  imports: [KeyValuePipe],
  templateUrl: './admin-resource.component.html',
  styleUrl: './admin-resource.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminResourceComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.data['title'] as string;
  readonly endpoint = this.route.snapshot.data['endpoint'] as AdminEndpoint;
  readonly rows = signal<unknown[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.api.get<unknown>(API_ROUTES.admin[this.endpoint]).subscribe({
      next: (response) => {
        this.rows.set(this.toRows(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(`Impossible de charger ${this.title.toLowerCase()}.`);
        this.loading.set(false);
      }
    });
  }

  isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  entries(value: unknown): Record<string, unknown> | null {
    return this.isRecord(value) ? value : null;
  }

  displayValue(value: unknown): string {
    return value === null || value === undefined
      ? '-'
      : typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  private toRows(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (this.isRecord(response) && Array.isArray(response['data'])) {
      return response['data'];
    }

    return response ? [response] : [];
  }
}
