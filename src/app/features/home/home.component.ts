import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { SiteData } from '../../core/models/site.model';
import { SiteDataService } from '../../core/services/site-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  readonly siteData$ = new BehaviorSubject<SiteData | undefined>(undefined);
  readonly showScrollTop$ = new BehaviorSubject(false);

  constructor(private siteDataService: SiteDataService) {}

  ngOnInit(): void {
    this.siteDataService.getSiteData().subscribe((data) => {
      this.siteData$.next(data);
    });

    this.updateScrollState();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    const heroHeight = window.innerHeight * 0.92;
    this.showScrollTop$.next(window.scrollY > heroHeight);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
