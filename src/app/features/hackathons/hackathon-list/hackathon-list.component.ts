import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChangeDetectorRef, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import { API_ROUTES } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Hackathon, HackathonListData } from '../../../core/models/hackathon.interface';

@Component({
  selector: 'app-hackathon-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hackathon-list.component.html',
  styleUrl: './hackathon-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HackathonListComponent implements OnInit {
  readonly tones = ['orange', 'dark', 'blue', 'cyan', 'green', 'yellow', 'pink', 'purple'];
  hackathons: Hackathon[] = [];
  searchTerm = '';
  selectedFilter = 'All Programs';
  isLoading = true;
  hasError = false;

  constructor(
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.get<ApiResponse<HackathonListData | Hackathon[]>>(API_ROUTES.public.hackathons)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.hackathons = this.itemsFromResponse(response.data);
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  get programs(): Array<Hackathon & { tone: string; featured: boolean }> {
    return this.filteredHackathons.map((hackathon, index) => ({
      ...hackathon,
      tone: this.tones[index % this.tones.length],
      featured: index === 0
    }));
  }

  get featuredProgram(): Hackathon | undefined {
    return this.filteredHackathons[0];
  }

  get filteredHackathons(): Hackathon[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.hackathons.filter((hackathon) => {
      const matchesSearch = [hackathon.title, hackathon.category, hackathon.location, hackathon.description]
        .some((value) => value?.toLowerCase().includes(term));
      const matchesFilter = this.selectedFilter === 'All Programs'
        || this.selectedFilter.toLowerCase().includes(hackathon.category?.toLowerCase() ?? '')
        || hackathon.category?.toLowerCase().includes(this.selectedFilter.replace(' Challenges', '').toLowerCase()) === true;
      return matchesSearch && matchesFilter;
    });
  }

  selectFilter(filter: string): void {
    this.selectedFilter = filter;
  }

  formatDates(hackathon: Hackathon): string {
    const start = hackathon.startAt || hackathon.startDate;
    const end = hackathon.endAt || hackathon.endDate;
    if (!start) {
      return 'Dates à venir';
    }
    const format = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(value));
    return end ? `${format(start)} - ${format(end)}` : format(start);
  }

  private itemsFromResponse(data: HackathonListData | Hackathon[]): Hackathon[] {
    return Array.isArray(data) ? data : data.items ?? [];
  }
}
