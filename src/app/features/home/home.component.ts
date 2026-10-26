import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';

import { API_ROUTES } from '../../core/constants/api-routes';
import { ApiService } from '../../core/http/api.service';
import { ApiResponse } from '../../core/models/api-response.interface';
import { EventItem, EventListData } from '../../core/models/event.interface';
import { SiteData } from '../../core/models/site.model';
import { SiteDataService } from '../../core/services/site-data.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  readonly siteData$ = new BehaviorSubject<SiteData | undefined>(undefined);
  readonly showScrollTop$ = new BehaviorSubject(false);
  readonly loading = new BehaviorSubject(true);
  events: EventItem[] = [];
  isLoadingEvents = true;
  hasEventsError = false;

  constructor(
    private siteDataService: SiteDataService,
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.siteDataService.getSiteData().subscribe((data) => {
      this.siteData$.next(data);
      this.loading.next(false);
    });

    this.loadEvents();
    this.updateScrollState();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    const heroHeight = window.innerHeight * 0.92;
    this.showScrollTop$.next(window.scrollY > heroHeight);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatEventDate(value: string): string {
    const date = this.parseEventDate(value);
    return date
      ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
      : 'Date à confirmer';
  }

  formatEventYear(value: string): string {
    return this.parseEventDate(value)?.getFullYear().toString() ?? '—';
  }

  formatEventDay(value: string): string {
    const date = this.parseEventDate(value);
    return date
      ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
      : 'À confirmer';
  }

  private loadEvents(): void {
    this.api.get<ApiResponse<EventListData>>(API_ROUTES.public.events, { limit: 3, upcoming: true })
      .pipe(finalize(() => {
        this.isLoadingEvents = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.events = (response.data?.items ?? [])
            .filter((event) => event.status === 'PUBLISHED')
            .slice(0, 3);
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasEventsError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  private parseEventDate(value: string): Date | null {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}