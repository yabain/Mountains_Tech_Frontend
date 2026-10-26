import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations';

import { OfficeMember, SiteData } from '../../core/models/site.model';
import { SiteDataService } from '../../core/services/site-data.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('scrollReveal', [
      state('hidden, visible', style({})),
      transition('hidden => visible', [
        query(
          'h2, h3, p, .about-eyebrow, .mission-icon, .engagement-facts span, .engagement-card, .core-value, .governance-card, .board-card, .board-linkedin',
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
export class AboutComponent implements OnDestroy {
  readonly siteData$: Observable<SiteData>;
  readonly revealedSections: Record<string, boolean> = {};
  readonly prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private historyTimelineElement?: HTMLOListElement;
  private sectionObserver?: IntersectionObserver;
  private scrollFrame = 0;
  private cachedBoardData?: SiteData;
  private cachedBoardMembers: OfficeMember[] = [];

  @ViewChild('aboutContent')
  set aboutContent(reference: ElementRef<HTMLElement> | undefined) {
    this.sectionObserver?.disconnect();
    if (!reference) {
      return;
    }

    const sections = reference.nativeElement.querySelectorAll<HTMLElement>(':scope > section[id]');
    if (this.prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
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

  @ViewChild('historyTimeline')
  set historyTimeline(reference: ElementRef<HTMLOListElement> | undefined) {
    this.historyTimelineElement = reference?.nativeElement;
    this.updateHistoryTimeline();
  }

  constructor(
    private readonly siteDataService: SiteDataService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.siteData$ = this.siteDataService.getSiteData();
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
    if (this.scrollFrame) {
      cancelAnimationFrame(this.scrollFrame);
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  scheduleHistoryTimelineUpdate(): void {
    if (this.scrollFrame) {
      return;
    }

    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      this.updateHistoryTimeline();
    });
  }

  boardMembers(data: SiteData): OfficeMember[] {
    if (this.cachedBoardData === data) {
      return this.cachedBoardMembers;
    }

    this.cachedBoardData = data;
    this.cachedBoardMembers = [
      {
        id: 0,
        name: data.generalManager.name,
        role: data.generalManager.role,
        company: data.generalManager.company,
        image: data.generalManager.image
      },
      ...data.values.officeMembers
    ];
    return this.cachedBoardMembers;
  }

  trackByBoardMember(_index: number, member: OfficeMember): number {
    return member.id;
  }

  boardInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return `${first}${last}`;
  }

  private updateHistoryTimeline(): void {
    const timeline = this.historyTimelineElement;
    if (!timeline || typeof window === 'undefined') {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bounds = timeline.getBoundingClientRect();
    const cursor = window.innerHeight * 0.7;
    const progress = reducedMotion
      ? 1
      : Math.max(0, Math.min(1, (cursor - bounds.top) / bounds.height));

    timeline.style.setProperty('--timeline-progress', String(progress));
    timeline.querySelectorAll<HTMLElement>('.history-milestone').forEach((milestone) => {
      milestone.classList.toggle(
        'milestone-active',
        reducedMotion || milestone.getBoundingClientRect().top < cursor
      );
    });
  }
}
