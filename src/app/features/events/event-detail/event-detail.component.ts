import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, PLATFORM_ID, REQUEST } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
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
export class EventDetailComponent implements OnInit, OnDestroy {
  event: EventItem | null = null;
  isLoading = true;
  hasError = false;
  copyStatus = '';
  private slug = '';
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private meta: Meta,
    private title: Title
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
          if (this.event) {
            this.updateSocialMetadata(this.event);
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

  needsRegistration(): boolean {
    return this.event?.registrationRequired ?? false;
  }

  copyEventLink(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const url = this.pageUrl;
    if (!navigator.clipboard) {
      this.copyStatus = this.copyWithFallback(url)
        ? 'Lien copié dans le presse-papiers.'
        : 'La copie automatique a échoué. Copiez le lien depuis la barre d’adresse.';
      return;
    }

    void navigator.clipboard.writeText(url)
      .then(() => {
        this.copyStatus = 'Lien copié dans le presse-papiers.';
        this.changeDetectorRef.markForCheck();
      })
      .catch(() => {
        this.copyStatus = this.copyWithFallback(url)
          ? 'Lien copié dans le presse-papiers.'
          : 'La copie automatique a échoué. Copiez le lien depuis la barre d’adresse.';
        this.changeDetectorRef.markForCheck();
      });
  }

  private copyWithFallback(url: string): boolean {
    const input = this.document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';

    let copied = false;
    try {
      this.document.body.appendChild(input);
      input.select();
      copied = this.document.execCommand('copy');
    } catch {
      copied = false;
    } finally {
      input.remove();
    }
    return copied;
  }

  private get pageUrl(): string {
    return this.request?.url || this.document.location?.href || this.document.baseURI;
  }

  private updateSocialMetadata(event: EventItem): void {
    const description = (event.excerpt || 'Découvrez cet événement organisé par MountainsTech.')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    const pageTitle = `${event.title} | MountainsTech`;
    const imageUrl = new URL(event.coverUrl || '/heroBg.jpg', this.pageUrl).href;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'event' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: this.pageUrl });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
  }

  ngOnDestroy(): void {
    const defaultTitle = 'MountainsTech';
    const defaultDescription = 'Découvrez les activités, projets et actualités de MountainsTech.';
    const defaultImage = new URL('/heroBg.jpg', this.pageUrl).href;

    this.title.setTitle(defaultTitle);
    this.meta.updateTag({ name: 'description', content: defaultDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: defaultTitle });
    this.meta.updateTag({ property: 'og:description', content: defaultDescription });
    this.meta.removeTag("property='og:url'");
    this.meta.updateTag({ property: 'og:image', content: defaultImage });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: defaultTitle });
    this.meta.updateTag({ name: 'twitter:description', content: defaultDescription });
    this.meta.updateTag({ name: 'twitter:image', content: defaultImage });
  }

  goBack(): void {
    window.history.back();
  }
}