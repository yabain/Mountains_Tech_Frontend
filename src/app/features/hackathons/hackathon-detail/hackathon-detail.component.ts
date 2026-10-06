import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Hackathon } from '../../../core/models/hackathon.interface';

@Component({
  selector: 'app-hackathon-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hackathon-detail.component.html',
  styleUrl: './hackathon-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HackathonDetailComponent implements OnInit {
  hackathon: Hackathon | null = null;
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
    this.loadHackathon();
  }

  loadHackathon(): void {
    this.api.get<ApiResponse<Hackathon>>(adminDynamicRoutes.publicHackathonSlug(this.slug))
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.hackathon = response.data ?? null;
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

  formatDates(): string {
    if (!this.hackathon) return 'Dates à venir';
    const start = this.hackathon.startAt || this.hackathon.startDate;
    const end = this.hackathon.endAt || this.hackathon.endDate;
    if (!start) return 'Dates à venir';
    const format = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(value));
    return end ? `${format(start)} - ${format(end)}` : format(start);
  }

  statusLabel(status?: string): string {
    if (!status) return '—';
    const labels: Record<string, string> = {
      draft: 'Brouillon', DRAFT: 'Brouillon',
      published: 'Publié', PUBLISHED: 'Publié',
      archived: 'Archivé', ARCHIVED: 'Archivé'
    };
    return labels[status] || status;
  }

  statusClass(status?: string): string {
    if (!status) return 'status-badge--neutral';
    const s = status.toLowerCase();
    if (['published'].includes(s)) return 'status-badge--success';
    if (['draft'].includes(s)) return 'status-badge--warning';
    if (['archived'].includes(s)) return 'status-badge--neutral';
    return 'status-badge--neutral';
  }

  needsRegistration(): boolean {
    return this.hackathon?.registrationRequired ?? false;
  }

  goBack(): void {
    window.history.back();
  }
}