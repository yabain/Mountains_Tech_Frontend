import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { AdminNavItem, navigationForUser } from '../../features/admin/admin-navigation';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [AsyncPipe, NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private static readonly COLLAPSE_KEY = 'mt_admin_sidebar_collapsed';

  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(this.loadCollapsed());
  readonly currentUser$ = this.authService.currentUser$;
  readonly navGroups = ['principal', 'contenu', 'système'] as const;

  navigationForUser = navigationForUser;

  groupLabel(group: AdminNavItem['group']): string {
    return group === 'principal' ? 'Principal' : group === 'contenu' ? 'Gestion du contenu' : 'Système';
  }

  navigationForGroup(user: Parameters<typeof navigationForUser>[0], group: AdminNavItem['group']): readonly AdminNavItem[] {
    return navigationForUser(user).filter((item) => item.group === group);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleCollapsed(): void {
    this.sidebarCollapsed.update((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(AdminLayoutComponent.COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => void this.router.navigate(['/login']));
  }

  private loadCollapsed(): boolean {
    return localStorage.getItem(AdminLayoutComponent.COLLAPSE_KEY) === '1';
  }
}
