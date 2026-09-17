import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { EventItem, EventListData } from '../../../core/models/event.interface';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  events: EventItem[] = [];
  searchTerm = '';
  isLoading = true;
  hasError = false;

  constructor(
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.get<ApiResponse<EventListData>>(API_ROUTES.public.events)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.events = response.data?.items ?? [];
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  get filteredEvents(): EventItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.events;
    }

    return this.events.filter((event) => [
      event.title,
      event.excerpt,
      event.category,
      event.location
    ].some((value) => value?.toLowerCase().includes(term)));
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(value));
  }

  formatTime(value: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  statusLabel(status: string): string {
    return status === 'PUBLISHED' ? 'À venir' : status === 'ARCHIVED' ? 'Terminé' : 'Bientôt';
  }
}
