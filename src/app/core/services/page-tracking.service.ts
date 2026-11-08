import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PageTrackingService {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private visitorId = '';
  private sessionId = '';

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.visitorId = this.createSessionId('mountains-tracking-visitor');
    this.sessionId = this.createSessionId('mountains-tracking-session');

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.trackPage(event.urlAfterRedirects));

    if (this.router.navigated) {
      this.trackPage(this.router.url);
    }
  }

  private trackPage(url: string): void {
    const page = url.split(/[?#]/, 1)[0] || '/';
    if (page === '/login' || page.startsWith('/dashboard')) return;

    void fetch(`${environment.apiUrl}/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        page,
        event: 'page_view'
      }),
      keepalive: true
    }).then((response) => {
      if (!response.ok) {
        console.warn(`Page tracking request failed with status ${response.status}.`);
      }
    }).catch((error: unknown) => {
      console.warn('Page tracking request could not be sent.', error);
    });
  }

  private createSessionId(key: string): string {
    try {
      const current = sessionStorage.getItem(key);
      if (current) return current;

      const id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
      return id;
    } catch (error: unknown) {
      console.warn('Page tracking session identifier could not be persisted.', error);
      return crypto.randomUUID();
    }
  }
}
