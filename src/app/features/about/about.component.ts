import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { SiteData } from '../../core/models/site.model';
import { SiteDataService } from '../../core/services/site-data.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
  readonly siteData$: Observable<SiteData>;

  constructor(private readonly siteDataService: SiteDataService) {
    this.siteData$ = this.siteDataService.getSiteData();
  }
}
