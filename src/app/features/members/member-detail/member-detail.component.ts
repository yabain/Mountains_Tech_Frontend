import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Member } from '../../../core/models/member.interface';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './member-detail.component.html',
  styleUrl: './member-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberDetailComponent implements OnInit {
  member: Member | null = null;
  isLoading = true;
  hasError = false;
  private slug = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    if (!this.slug) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }
    this.loadMember();
  }

  loadMember(): void {
    this.api.get<ApiResponse<Member>>(adminDynamicRoutes.publicMemberSlug(this.slug))
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.member = response.data ?? null;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  memberName(): string {
    if (!this.member) return '';
    return this.member.name || [this.member.firstName, this.member.lastName].filter(Boolean).join(' ') || this.member.email;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Actif', ACTIVE: 'Actif', approved: 'Approuvé', APPROVED: 'Approuvé',
      pending: 'En attente', PENDING: 'En attente',
      inactive: 'Inactif', INACTIVE: 'Inactif',
      rejected: 'Rejeté', REJECTED: 'Rejeté',
      suspended: 'Suspendu', SUSPENDED: 'Suspendu'
    };
    return labels[status] || status;
  }

  statusClass(status: string): string {
    const s = status.toLowerCase();
    if (['active', 'approved', 'published'].includes(s)) return 'status-badge--success';
    if (['pending'].includes(s)) return 'status-badge--warning';
    if (['inactive', 'rejected', 'suspended', 'archived'].includes(s)) return 'status-badge--danger';
    return 'status-badge--neutral';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(value));
  }

  goBack(): void {
    window.history.back();
  }
}