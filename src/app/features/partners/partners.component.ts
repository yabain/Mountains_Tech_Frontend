import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES } from '../../core/constants/api-routes';
import { ApiService } from '../../core/http/api.service';
import { ApiResponse } from '../../core/models/api-response.interface';
import { Partner } from '../../core/models/partner.interface';

interface PartnerListData {
  items: Partner[];
}

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnersComponent implements OnInit {
  partners: Partner[] = [];
  searchTerm = '';
  isLoading = true;
  hasError = false;

  constructor(
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.get<ApiResponse<PartnerListData | Partner[]>>(API_ROUTES.public.partners)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.partners = this.itemsFromResponse(response.data);
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  get filteredPartners(): Partner[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.partners;
    }

    return this.partners.filter((partner) => [
      partner.name,
      partner.description,
      partner.website
    ].some((value) => value?.toLowerCase().includes(term)));
  }

  partnerInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }

  trackByPartner(_index: number, partner: Partner): string {
    return partner.id;
  }

  private itemsFromResponse(data: PartnerListData | Partner[]): Partner[] {
    return Array.isArray(data) ? data : data.items ?? [];
  }
}
