import { AsyncPipe, } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { AdminNotificationsComponent } from '../../features/admin/notifications/admin-notifications.component';
import { ADMIN_NAV_ITEMS, AdminNavItem, AdminRole, ROLE_PERMISSIONS, normalizeRole } from '../../features/admin/admin-navigation';
import { AdminSidebarCountsService } from '../../features/admin/admin-sidebar-counts.service';
import { DashboardDataService } from '../../features/admin/dashboard/dashboard-data.service';
import { TopBarComponent } from '../../shared/components/top-bar/top-bar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, AlertComponent, AdminNotificationsComponent, TopBarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayoutComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly sidebarCounts = inject(AdminSidebarCountsService);
  readonly dashboardData = inject(DashboardDataService);

  @ViewChild('adminNav', { read: ElementRef }) adminNav?: ElementRef<HTMLElement>;

  private static readonly COLLAPSE_KEY = 'mt_admin_sidebar_collapsed_v2';

  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(this.loadCollapsed());
  readonly currentUser$ = this.authService.currentUser$;
  readonly navGroups = ['principal', 'contenu', 'communication', 'système'] as const;
  readonly previewRole = signal<AdminRole>(this.initialRole());
  readonly notificationsOpen = signal(false);
  readonly currentCategory = signal<string | null>(null);
  readonly navHasMore = signal(false);
  readonly welcomeShown = signal(false);

  readonly navItems = computed(() => {
    const role = this.previewRole();
    return ADMIN_NAV_ITEMS.filter((item) => ROLE_PERMISSIONS[role].includes(item.permission));
  });

  constructor() {
    this.refreshCurrentRouteCount();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const url = this.router.url;
        const match = ADMIN_NAV_ITEMS
          .filter((item) => url === item.route || url.startsWith(`${item.route}/`))
          .sort((a, b) => b.route.length - a.route.length)[0];
        this.currentCategory.set(url.startsWith('/dashboard/profile') ? 'Mon profil' : match?.label ?? null);
        this.notificationsOpen.set(false);
        this.refreshCurrentRouteCount();
      });
  }

  navForGroup(group: AdminNavItem['group']): readonly AdminNavItem[] {
    return this.navItems().filter((item) => item.group === group);
  }

  navCount(route: string): number | null {
    return this.sidebarCounts.countForRoute(route)?.value ?? null;
  }

  hasNavCount(route: string): boolean {
    const count = this.navCount(route);
    return count !== null && count > 0;
  }

  navCountUnavailable(route: string): boolean {
    return this.sidebarCounts.countForRoute(route)?.unavailable ?? false;
  }

  navCountLabel(route: string): string {
    return this.sidebarCounts.labelForRoute(route);
  }

  onNavItemClick(route: string): void {
    if (this.router.url === route) {
      this.sidebarCounts.refreshForRoute(route);
    }
    this.closeSidebar();
  }

  groupLabel(group: AdminNavItem['group']): string {
    switch (group) {
      case 'principal': return 'Principal';
      case 'contenu': return 'Gestion du contenu';
      case 'communication': return 'Communication';
      case 'système': return 'Système';
    }
  }

  onNavScroll(): void {
    this.updateNavFade();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  toggleNavigation(): void {
    if (window.matchMedia('(max-width: 768px)').matches) {
      this.toggleSidebar();
      return;
    }

    this.toggleCollapsed();
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleCollapsed(): void {
    if (window.matchMedia('(max-width: 768px)').matches) {
      this.sidebarOpen.set(false);
      return;
    }
    this.sidebarCollapsed.update((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(AdminLayoutComponent.COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
  }

  logout(): void {
    this.authService.logout().subscribe(() => void this.router.navigate(['/login']));
  }

  onWelcomeAutoClosed(): void {
    this.welcomeShown.set(true);
  }

  ngAfterViewInit(): void {
    this.updateNavFade();
  }

  private updateNavFade(): void {
    const nav = this.adminNav?.nativeElement;
    if (!nav) {
      return;
    }
    const hasMore = nav.scrollHeight - nav.clientHeight - nav.scrollTop > 2;
    this.navHasMore.set(hasMore);
  }

  private loadCollapsed(): boolean {
    return localStorage.getItem(AdminLayoutComponent.COLLAPSE_KEY) !== '0';
  }

  private refreshCurrentRouteCount(): void {
    const url = this.router.url;
    const item = ADMIN_NAV_ITEMS.find((candidate) => url === candidate.route);
    if (item) {
      this.sidebarCounts.refreshForRoute(item.route);
    }
  }

  private initialRole(): AdminRole {
    return normalizeRole(this.authService.currentUser$.value?.role ?? '') ?? 'SUPER_ADMIN';
  }
}
