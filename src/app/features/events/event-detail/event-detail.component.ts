import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { EventItem } from '../../../core/models/event.interface';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventDetailComponent implements OnInit {
  event: EventItem | null = null;
  isLoading = true;
  hasError = false;
  private slug = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    if (!this.slug) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.loadEvent();
  }

  loadEvent(): void {
    this.api.get<ApiResponse<EventItem>>(adminDynamicRoutes.publicEventSlug(this.slug))
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.event = response.data ?? null;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(value));
  }

  formatTime(value?: string): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(value));
  }

  statusLabel(status: string): string {
    return status === 'PUBLISHED' ? 'À venir' : status === 'ARCHIVED' ? 'Terminé' : 'Brouillon';
  }

  statusClass(status: string): string {
    const s = status.toLowerCase();
    if (['published'].includes(s)) return 'status-badge--success';
    if (['draft'].includes(s)) return 'status-badge--warning';
    if (['archived'].includes(s)) return 'status-badge--neutral';
    return 'status-badge--neutral';
  }

  needsRegistration(): boolean {
    return this.event?.registrationRequired ?? false;
  }

  goBack(): void {
    window.history.back();
  }
}