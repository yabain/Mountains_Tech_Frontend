import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, REQUEST } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { finalize, Subject, Subscription, takeUntil } from 'rxjs';

import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Activity } from '../../../core/models/activity.interface';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-detail.component.html',
  styleUrl: './activity-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityDetailComponent implements OnInit, OnDestroy {
  activity: Activity | null = null;
  relatedActivities: Activity[] = [];
  isLoading = true;
  hasError = false;
  isRelatedLoading = true;
  relatedError = false;
  private slug = '';
  private readonly destroy$ = new Subject<void>();
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });
  private activityRequest?: Subscription;
  private relatedRequest?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private meta: Meta,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.activityRequest?.unsubscribe();
        this.relatedRequest?.unsubscribe();
        this.slug = params.get('slug') || '';
        this.activity = null;
        this.relatedActivities = [];
        this.isLoading = Boolean(this.slug);
        this.hasError = !this.slug;
        this.isRelatedLoading = Boolean(this.slug);
        this.relatedError = false;
        this.resetSocialMetadata();

        if (this.slug) {
          this.loadActivity();
          this.loadRelatedActivities();
        }
        this.changeDetectorRef.markForCheck();
      });
  }

  loadActivity(): void {
    this.activityRequest = this.api.get<ApiResponse<Activity>>(adminDynamicRoutes.publicActivitySlug(this.slug))
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.activity = response.data ?? null;
          if (this.activity) {
            this.updateSocialMetadata(this.activity);
          } else {
            this.hasError = true;
          }
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  loadRelatedActivities(): void {
    this.relatedRequest = this.api.get<ApiResponse<{ items: Activity[] }>>(API_ROUTES.public.activities)
      .pipe(finalize(() => {
        this.isRelatedLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.relatedActivities = (response.data?.items ?? [])
            .filter((activity) => activity.slug !== this.slug && activity.id !== this.slug)
            .slice(0, 4);
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.relatedError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  get articleImage(): string | undefined {
    return this.activity?.coverUrl || this.activity?.imageUrl;
  }

  get shareUrl(): string {
    return encodeURIComponent(this.pageUrl);
  }

  private get pageUrl(): string {
    return this.request?.url || this.document.location?.href || this.document.baseURI;
  }

  private updateSocialMetadata(activity: Activity): void {
    const description = (activity.excerpt || activity.description || 'Découvrez les actualités de MountainsTech.')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    const pageTitle = `${activity.title} | MountainsTech`;
    const imageUrl = new URL(this.articleImage || '/heroBg.jpg', this.pageUrl).href;
    const pageUrl = this.pageUrl;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activityRequest?.unsubscribe();
    this.relatedRequest?.unsubscribe();
    this.resetSocialMetadata();
  }

  private resetSocialMetadata(): void {
    const defaultTitle = 'MountainsTech';
    const defaultDescription = 'Découvrez les activités, projets et actualités de MountainsTech.';
    const defaultImage = new URL('/heroBg.jpg', this.pageUrl).href;

    this.title.setTitle(defaultTitle);
    this.meta.updateTag({ name: 'description', content: defaultDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: defaultTitle });
    this.meta.updateTag({ property: 'og:description', content: defaultDescription });
    this.meta.updateTag({ property: 'og:image', content: defaultImage });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: defaultTitle });
    this.meta.updateTag({ name: 'twitter:description', content: defaultDescription });
    this.meta.updateTag({ name: 'twitter:image', content: defaultImage });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(value));
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

  goBack(): void {
    window.history.back();
  }
}