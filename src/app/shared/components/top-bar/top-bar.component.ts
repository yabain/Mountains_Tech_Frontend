import { AsyncPipe, } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthUser } from '../../../core/auth/services/auth.service';
import { normalizeRole } from '../../../features/admin/admin-navigation';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  EDITOR: 'Éditeur',
  COMMUNICATION: 'Communication'
};

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly currentCategory = input<string | null>(null);
  readonly sidebarCollapsed = input(false);
  readonly notificationsOpen = input(false);
  readonly hasUnseenNotifications = input(false);
  readonly toggleSidebar = output<void>();
  readonly toggleNotifications = output<void>();

  readonly currentUser$ = this.authService.currentUser$;
  readonly accountMenuOpen = signal(false);
  readonly profileDetailsOpen = signal(false);
  readonly welcomeShown = signal(false);

  userInitials(user: AuthUser | null): string {
    if (!user) {
      return '?';
    }
    const words = user.name.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase() || '?';
  }

  roleLabel(user: AuthUser | null): string {
    const role = user ? normalizeRole(user.role) : null;
    return role ? ROLE_LABELS[role] : user?.role ?? '';
  }

  toggleAccountMenu(): void {
    const isOpening = !this.accountMenuOpen();
    this.accountMenuOpen.set(isOpening);
    this.profileDetailsOpen.set(false);
  }

  showProfileDetails(): void {
    this.profileDetailsOpen.set(true);
  }

  showAccountActions(): void {
    this.profileDetailsOpen.set(false);
  }

  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
    this.profileDetailsOpen.set(false);
  }

  rebuildSite(): void {
    window.location.reload();
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.closeAccountMenu();
      void this.router.navigate(['/login']);
    });
  }

  @HostListener('document:click', ['$event'])
  closeWhenClickingOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeAccountMenu();
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.closeAccountMenu();
  }

  onWelcomeAutoClosed(): void {
    this.welcomeShown.set(true);
  }
}
