import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private readonly platformId = inject(PLATFORM_ID);
  readonly isScrolled$ = new BehaviorSubject(false);
  readonly isHomePage$ = new BehaviorSubject(false);
  readonly isMenuOpen$ = new BehaviorSubject(false);

  constructor(private router: Router) {
    this.updateHomePageState(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateHomePageState(event.urlAfterRedirects);
        this.isMenuOpen$.next(false);
      });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled$.next(this.isHomePage$.value && window.scrollY > 10);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen$.next(!this.isMenuOpen$.value);
  }

  @HostListener('document:keydown.escape')
  closeMenu(): void {
    this.isMenuOpen$.next(false);
  }

  private updateHomePageState(url: string): void {
    const isHomePage = url === '/' || url === '/home';
    this.isHomePage$.next(isHomePage);

    if (!isHomePage) {
      this.isScrolled$.next(false);
      return;
    }

    this.isScrolled$.next(isPlatformBrowser(this.platformId) && window.scrollY > 10);
  }
}
