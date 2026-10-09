import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, AuthUser } from '../../core/auth/services/auth.service';
import { AdminNotificationsComponent } from '../../features/admin/notifications/admin-notifications.component';
import { ADMIN_NAV_ITEMS, AdminNavItem, AdminRole, ROLE_PERMISSIONS, normalizeRole } from '../../features/admin/admin-navigation';

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  EDITOR: 'Éditeur',
  COMMUNICATION: 'Communication'
};

const NAV_COUNTS: Readonly<Record<string, number>> = {
  members: 3,
  contacts: 5
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet, AdminNotificationsComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayoutComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('adminNav', { read: ElementRef }) adminNav?: ElementRef<HTMLElement>;

  private static readonly COLLAPSE_KEY = 'mt_admin_sidebar_collapsed';

  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(this.loadCollapsed());
  readonly currentUser$ = this.authService.currentUser$;
  readonly navGroups = ['principal', 'contenu', 'système'] as const;
  readonly roles = Object.keys(ROLE_PERMISSIONS) as AdminRole[];
  readonly roleLabels = ROLE_LABELS;
  readonly previewRole = signal<AdminRole>(this.initialRole());
  readonly profileOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly currentCategory = signal<string | null>(null);
  readonly navHasMore = signal(false);

  readonly navItems = computed(() => {
    const role = this.previewRole();
    return ADMIN_NAV_ITEMS.filter((item) => ROLE_PERMISSIONS[role].includes(item.permission));
  });

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;
        const match = ADMIN_NAV_ITEMS.find((item) => url === item.route || url.startsWith(`${item.route}/`));
        this.currentCategory.set(match?.label ?? null);
        this.notificationsOpen.set(false);
      });
  }

  navForGroup(group: AdminNavItem['group']): readonly AdminNavItem[] {
    return this.navItems().filter((item) => item.group === group);
  }

  navCount(permission: AdminNavItem['permission']): number | undefined {
    return NAV_COUNTS[permission];
  }

  groupLabel(group: AdminNavItem['group']): string {
    return group === 'principal' ? 'Principal' : group === 'contenu' ? 'Gestion du contenu' : 'Système';
  }

  userInitials(user: AuthUser | null): string {
    if (!user) {
      return '?';
    }
    const words = user.name.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase() || '?';
  }

  roleLabel(user: AuthUser | null): string {
    const role = user ? normalizeRole(user.role) : null;
    return role ? ROLE_LABELS[role] : '';
  }

  onNavScroll(): void {
    this.updateNavFade();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
    this.profileOpen.set(false);
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

  toggleProfile(): void {
    this.profileOpen.update((open) => !open);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
  }

  onRoleChange(event: Event): void {
    this.previewRole.set((event.target as HTMLSelectElement).value as AdminRole);
  }

  refresh(): void {
    window.location.reload();
  }

  logout(): void {
    this.authService.logout().subscribe(() => void this.router.navigate(['/login']));
  }

  private initialRole(): AdminRole {
    return normalizeRole(this.authService.currentUser$.value?.role ?? '') ?? 'SUPER_ADMIN';
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
    return localStorage.getItem(AdminLayoutComponent.COLLAPSE_KEY) === '1';
  }
}