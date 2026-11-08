import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  animate,
  query,
  stagger,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';

import { API_ROUTES } from '../../core/constants/api-routes';
import { ApiService } from '../../core/http/api.service';
import { ApiResponse } from '../../core/models/api-response.interface';
import { EventItem, EventListData } from '../../core/models/event.interface';
import { SiteData } from '../../core/models/site.model';
import { SiteDataService } from '../../core/services/site-data.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

interface PartnerLogo {
  name: string;
  src: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('scrollReveal', [
      state('hidden, visible', style({})),
      transition('hidden => visible', [
        query(
          'h1, h2, h3, p, .section-eyebrow, img, .hero__actions, .stat, .highlight__icon, .mission-card__mark, .key-figure, .activity-card__category, .project-tag, .partner-action, .partner-item, .newsletter__form, app-button, .home-action, .newsletter__contact',
          [
            style({ opacity: 0, transform: 'translateY(18px)' }),
            stagger('65ms', [
              animate(
                '420ms cubic-bezier(0.2, 0.65, 0.3, 1)',
                style({ opacity: 1, transform: 'translateY(0)' })
              )
            ])
          ],
          { optional: true }
        )
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly siteData$ = new BehaviorSubject<SiteData | undefined>(undefined);
  readonly showScrollTop$ = new BehaviorSubject(false);
  readonly loading = new BehaviorSubject(true);
  readonly revealedSections: Record<string, boolean> = {};
  readonly logoTrackCopies = [0, 1];
  readonly partnerLogoColumns: PartnerLogo[][] = [
    [
      { name: 'Clemios', src: '/logopartenaires/clemios_logo.jpg' },
      { name: 'DigiKuntz', src: '/logopartenaires/digikuntz.jpg' },
      { name: 'SDK Games', src: '/logopartenaires/sdkGames.png' }
    ],
    [
      { name: 'Adorsys International', src: '/logopartenaires/adorsys_international_logo.jpg' },
      { name: 'Général Biotech', src: '/logopartenaires/Genrabiotech.png' },
      { name: 'Yaba-In', src: '/logopartenaires/yabaIn.webp' }
    ],
    [
      { name: 'Mboa Intech', src: '/logopartenaires/mboa-in-tech.jpg' },
      { name: 'Sky', src: '/logopartenaires/sky.jpg' },
      { name: 'Technopark', src: '/logopartenaires/technopark.png' }
    ]
  ];
  readonly prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollProgress = 0;
  events: EventItem[] = [];
  isLoadingEvents = true;
  hasEventsError = false;
  newsletterForm: Record<string, string> = {};
  newsletterSubmitting = false;
  newsletterSubmitted = false;
  newsletterSubmittedEmail = '';
  newsletterError = '';
  private sectionObserver?: IntersectionObserver;

  @ViewChild('homeContent')
  set homeContent(element: ElementRef<HTMLElement> | undefined) {
    this.sectionObserver?.disconnect();
    if (!element) {
      return;
    }

    const sections = element.nativeElement.querySelectorAll<HTMLElement>(':scope > section[id]');
    if (typeof IntersectionObserver === 'undefined') {
      sections.forEach((section) => {
        this.revealedSections[section.id] = true;
      });
      return;
    }

    this.sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const section = entry.target as HTMLElement;
        this.revealedSections[section.id] = true;
        observer.unobserve(section);
        this.changeDetectorRef.markForCheck();
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    sections.forEach((section) => this.sectionObserver?.observe(section));
  }

  constructor(
    private siteDataService: SiteDataService,
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  isNavbarLogo(source: string | undefined): boolean {
    return !!source && /(?:^|\/)logoNavBar\.png(?:[?#].*)?$/i.test(source);
  }

  ngOnInit(): void {
    this.siteDataService.getSiteData().subscribe((data) => {
      this.siteData$.next(data);
      this.loading.next(false);
      this.updateScrollState();
    });

    this.loadEvents();
    this.updateScrollState();
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    const hero = document.querySelector<HTMLElement>('.page-home .hero');
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const heroHasPassed = hero ? hero.getBoundingClientRect().bottom <= 0 : false;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

    this.showScrollTop$.next(heroHasPassed);
    this.scrollProgress = scrollableHeight > 0
      ? Math.min(100, Math.max(0, (scrollY / scrollableHeight) * 100))
      : 0;
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

  formatActivityDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Date à confirmer'
      : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  formatEventYear(value: string): string {
    return this.parseEventDate(value)?.getFullYear().toString() ?? '—';
  }

  subscribeToNewsletter(): void {
    if (this.newsletterSubmitting || this.newsletterSubmitted) {
      return;
    }

    const email = this.newsletterForm['email']?.trim() ?? '';
    if (!email) {
      this.newsletterError = 'Veuillez renseigner une adresse e-mail valide.';
      return;
    }

    const firstName = (this.newsletterForm['firstName'] ?? this.newsletterForm['name'] ?? '').trim();
    this.newsletterSubmitting = true;
    this.newsletterError = '';
    this.api.post<ApiResponse<unknown>>(API_ROUTES.public.newsletter, {
      email,
      ...(firstName ? { firstName } : {}),
      consent: true
    })
      .pipe(finalize(() => {
        this.newsletterSubmitting = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.newsletterSubmittedEmail = email;
          this.newsletterSubmitted = true;
          this.changeDetectorRef.markForCheck();
        },
        error: (error: { error?: { message?: string | string[] } }) => {
          const message = error.error?.message;
          this.newsletterError = Array.isArray(message)
            ? message.join(' ')
            : message ?? 'Impossible de confirmer votre inscription. Veuillez réessayer.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  formatEventDay(value: string): string {
    const date = this.parseEventDate(value);
    return date
      ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
      : 'À confirmer';
  }

  private loadEvents(): void {
    this.api.get<ApiResponse<EventListData>>(API_ROUTES.public.events)
      .pipe(finalize(() => {
        this.isLoadingEvents = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.events = response.data?.items?.slice(0, 3) ?? [];
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