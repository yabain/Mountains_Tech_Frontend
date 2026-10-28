import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Member, MemberListData } from '../../../core/models/member.interface';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberListComponent implements OnInit {
  members: Member[] = [];
  searchTerm = '';
  isLoading = true;
  hasError = false;

  constructor(
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.get<ApiResponse<MemberListData | Member[]>>(API_ROUTES.public.members)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.members = this.itemsFromResponse(response.data);
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  get filteredMembers(): Member[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.members;
    }

    return this.members.filter((member) => [
      this.memberName(member),
      member.email,
      member.role,
      member.status,
      ...(member.sectors ?? [])
    ].some((value) => value?.toLowerCase().includes(term)));
  }

  memberName(member: Member): string {
    return member.name || [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Actif', ACTIVE: 'Actif', pending: 'En attente', PENDING: 'En attente',
      inactive: 'Inactif', INACTIVE: 'Inactif'
    };
    return labels[status] || status;
  }

  formatMemberDate(value?: string): string {
    if (!value) {
      return 'Non renseignée';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Non renseignée';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  memberSectorLabel(member: Member): string {
    return `Secteur${(member.sectors?.length ?? 0) > 1 ? 's' : ''} d’activité`;
  }

  memberSectors(member: Member): string {
    return member.sectors?.length ? member.sectors.join(', ') : 'Non renseigné';
  }

  trackByMember(_index: number, member: Member): string {
    return member.id;
  }

  private itemsFromResponse(data: MemberListData | Member[]): Member[] {
    return Array.isArray(data) ? data : data.items ?? [];
  }
}
