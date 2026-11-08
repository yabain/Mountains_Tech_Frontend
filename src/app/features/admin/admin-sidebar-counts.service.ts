import { Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, catchError, switchMap } from 'rxjs';

import { API_ROUTES, adminDynamicRoutes } from '../../core/constants/api-routes';
import { ApiService } from '../../core/http/api.service';

export type AdminSidebarCountKey =
  | 'members'
  | 'memberApplications'
  | 'contacts'
  | 'hackathonRegistrations'
  | 'newsletter';

export interface AdminSidebarCount {
  value: number | null;
  unavailable: boolean;
}

interface PageData {
  items: Record<string, unknown>[];
  total?: number;
  pages?: number;
}

interface CompletePageData {
  items: Record<string, unknown>[];
  complete: boolean;
}

const PAGE_SIZE = 100;
const NEW_SUBSCRIBER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const EMPTY_COUNT: AdminSidebarCount = { value: null, unavailable: false };

@Injectable({ providedIn: 'root' })
export class AdminSidebarCountsService {
  readonly counts = signal<Record<AdminSidebarCountKey, AdminSidebarCount>>({
    members: { ...EMPTY_COUNT },
    memberApplications: { ...EMPTY_COUNT },
    contacts: { ...EMPTY_COUNT },
    hackathonRegistrations: { ...EMPTY_COUNT },
    newsletter: { ...EMPTY_COUNT }
  });

  private readonly loading = new Set<AdminSidebarCountKey>();
  private readonly refreshQueued = new Set<AdminSidebarCountKey>();

  constructor(private readonly api: ApiService) {}

  refreshForRoute(route: string): void {
    const key = this.countKeyForRoute(route);
    if (!key) {
      return;
    }
    if (this.loading.has(key)) {
      this.refreshQueued.add(key);
      return;
    }
    this.loading.add(key);
    this.fetchCount(key).subscribe({
      next: (count) => {
        this.counts.update((current) => ({ ...current, [key]: count }));
        this.finishRefresh(key);
      },
      error: () => {
        this.counts.update((current) => ({
          ...current,
          [key]: current[key].value === null
            ? { value: null, unavailable: true }
            : current[key]
        }));
        this.finishRefresh(key);
      }
    });
  }

  countForRoute(route: string): AdminSidebarCount | null {
    const keyByRoute: Record<string, AdminSidebarCountKey> = {
      '/dashboard/members': 'members',
      '/dashboard/members/applications': 'memberApplications',
      '/dashboard/contacts': 'contacts',
      '/dashboard/hackathons': 'hackathonRegistrations',
      '/dashboard/newsletter': 'newsletter'
    };
    const key = keyByRoute[route];
    return key ? this.counts()[key] : null;
  }

  labelForRoute(route: string): string {
    const labels: Record<string, string> = {
      '/dashboard/members': 'membres en attente',
      '/dashboard/members/applications': 'demandes d’adhésion en attente',
      '/dashboard/contacts': 'messages non lus',
      '/dashboard/hackathons': 'inscriptions d’équipes à traiter',
      '/dashboard/newsletter': 'nouveaux abonnés cette semaine'
    };
    return labels[route] ?? 'éléments à traiter';
  }

  private finishRefresh(key: AdminSidebarCountKey): void {
    this.loading.delete(key);
    if (this.refreshQueued.delete(key)) {
      this.refreshForRoute(this.routeForCountKey(key));
    }
  }

  private fetchCount(key: AdminSidebarCountKey): Observable<AdminSidebarCount> {
    switch (key) {
      case 'members':
        return this.fetchStatusCount(API_ROUTES.admin.members, 'PENDING');
      case 'memberApplications':
        return this.fetchStatusCount(API_ROUTES.admin.memberApplications, 'PENDING');
      case 'contacts':
        return this.fetchUnreadContactCount();
      case 'hackathonRegistrations':
        return this.fetchPendingHackathonRegistrations();
      case 'newsletter':
        return this.fetchRecentNewsletterSubscribers();
    }
  }

  private countKeyForRoute(route: string): AdminSidebarCountKey | null {
    const keyByRoute: Record<string, AdminSidebarCountKey> = {
      '/dashboard/members': 'members',
      '/dashboard/members/applications': 'memberApplications',
      '/dashboard/contacts': 'contacts',
      '/dashboard/hackathons': 'hackathonRegistrations',
      '/dashboard/newsletter': 'newsletter'
    };
    return keyByRoute[route] ?? null;
  }

  private routeForCountKey(key: AdminSidebarCountKey): string {
    const routeByKey: Record<AdminSidebarCountKey, string> = {
      members: '/dashboard/members',
      memberApplications: '/dashboard/members/applications',
      contacts: '/dashboard/contacts',
      hackathonRegistrations: '/dashboard/hackathons',
      newsletter: '/dashboard/newsletter'
    };
    return routeByKey[key];
  }

  private fetchStatusCount(endpoint: string, status: string): Observable<AdminSidebarCount> {
    return this.api.get<unknown>(endpoint, { status, limit: PAGE_SIZE, page: 1 }).pipe(
      map((response) => {
        const page = this.extractPage(response);
        if (page.total !== undefined) return { value: page.total, unavailable: false };
        if (page.items.length < PAGE_SIZE) {
          const matching = page.items.filter((row) => String(row['status'] ?? '').toUpperCase() === status);
          return { value: matching.length, unavailable: false };
        }
        return { value: null, unavailable: true };
      }),
      catchError(() => of({ value: null, unavailable: true }))
    );
  }

  private fetchUnreadContactCount(): Observable<AdminSidebarCount> {
    return forkJoin([
      this.fetchStatusCount(API_ROUTES.admin.contacts, 'NEW'),
      this.fetchStatusCount(API_ROUTES.admin.contacts, 'IN_PROGRESS')
    ]).pipe(map((counts) => {
      if (counts.some((count) => count.value === null)) {
        return { value: null, unavailable: true };
      }
      return {
        value: counts.reduce((total, count) => total + (count.value ?? 0), 0),
        unavailable: false
      };
    }));
  }

  private fetchPendingHackathonRegistrations(): Observable<AdminSidebarCount> {
    return this.fetchAllPages(API_ROUTES.admin.hackathons).pipe(
      switchMap(({ items: hackathons, complete }) => {
        if (!complete) return of({ value: null, unavailable: true });
        const ids = hackathons
          .map((hackathon) => String(hackathon['id'] ?? hackathon['_id'] ?? ''))
          .filter(Boolean);
        if (!ids.length) return of({ value: 0, unavailable: false });

        return forkJoin(ids.map((id) =>
          this.fetchStatusCount(adminDynamicRoutes.hackathonTeams(encodeURIComponent(id)), 'PENDING')
        )).pipe(map((counts) => {
          if (counts.some((count) => count.value === null)) {
            return { value: null, unavailable: true };
          }
          return {
            value: counts.reduce((total, count) => total + (count.value ?? 0), 0),
            unavailable: false
          };
        }));
      }),
      catchError(() => of({ value: null, unavailable: true }))
    );
  }

  private fetchRecentNewsletterSubscribers(): Observable<AdminSidebarCount> {
    return this.fetchAllPages(API_ROUTES.admin.newsletter, 'SUBSCRIBED').pipe(
      map(({ items: subscribers, complete }) => {
        if (!complete) return { value: null, unavailable: true };
        const cutoff = Date.now() - NEW_SUBSCRIBER_WINDOW_MS;
        const recentCount = subscribers.filter((subscriber) => {
          const createdAt = subscriber['createdAt'] ?? subscriber['subscribedAt'];
          const timestamp = typeof createdAt === 'string' || typeof createdAt === 'number'
            ? new Date(createdAt).getTime()
            : Number.NaN;
          return Number.isFinite(timestamp)
            && timestamp >= cutoff
            && (!subscriber['status'] || String(subscriber['status']).toUpperCase() === 'SUBSCRIBED');
        }).length;
        return { value: recentCount, unavailable: false };
      }),
      catchError(() => of({ value: null, unavailable: true }))
    );
  }

  private fetchAllPages(endpoint: string, status?: string): Observable<CompletePageData> {
    return this.api.get<unknown>(endpoint, { limit: PAGE_SIZE, page: 1, ...(status ? { status } : {}) }).pipe(
      switchMap((response) => {
        const firstPage = this.extractPage(response);
        const pageCount = firstPage.pages ?? (
          firstPage.total === undefined ? 1 : Math.ceil(firstPage.total / PAGE_SIZE)
        );
        if (pageCount <= 1) {
          return of({
            items: firstPage.items,
            complete: firstPage.total === undefined
              ? firstPage.items.length < PAGE_SIZE
              : firstPage.items.length >= firstPage.total
          });
        }
        const remainingPages = Array.from({ length: pageCount - 1 }, (_, index) =>
          this.api.get<unknown>(endpoint, { limit: PAGE_SIZE, page: index + 2, ...(status ? { status } : {}) })
        );
        return forkJoin(remainingPages).pipe(
          map((responses) => {
            const items = [
              ...firstPage.items,
              ...responses.flatMap((pageResponse) => this.extractPage(pageResponse).items)
            ];
            return {
              items,
              complete: firstPage.total === undefined || items.length >= firstPage.total
            };
          })
        );
      })
    );
  }

  private extractPage(response: unknown): PageData {
    if (Array.isArray(response)) {
      return { items: response.filter(this.isRecord) };
    }
    if (!this.isRecord(response)) return { items: [] };

    if (Array.isArray(response['data'])) {
      return { items: response['data'].filter(this.isRecord) };
    }
    const data = this.isRecord(response['data']) ? response['data'] : response;
    const itemsValue = Array.isArray(data['items'])
      ? data['items']
      : Array.isArray(data['teams'])
        ? data['teams']
        : Array.isArray(data['subscribers'])
          ? data['subscribers']
          : Array.isArray(data['applications'])
            ? data['applications']
            : Array.isArray(data['members'])
              ? data['members']
              : [];
    const items = itemsValue.filter(this.isRecord);
    const pagination = this.isRecord(data['pagination']) ? data['pagination'] : null;
    const total = pagination?.['total'] ?? data['total'];
    const pages = pagination?.['pages'] ?? data['pages'];
    return {
      items,
      ...(typeof total === 'number' ? { total } : {}),
      ...(typeof pages === 'number' ? { pages } : {})
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
