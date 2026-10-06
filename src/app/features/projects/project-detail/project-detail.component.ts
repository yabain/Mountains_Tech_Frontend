import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Project } from '../../../core/models/project.interface';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
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
    this.loadProject();
  }

  loadProject(): void {
    this.api.get<ApiResponse<Project>>(adminDynamicRoutes.publicProjectSlug(this.slug))
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.project = response.data ?? null;
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  projectTitle(): string {
    if (!this.project) return '';
    return this.project.title || this.project.name;
  }

  projectDescription(): string {
    if (!this.project) return '';
    return this.project.excerpt || this.project.description || 'Découvrez ce projet porté par MountainTech.';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(value));
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'En cours', ACTIVE: 'En cours',
      completed: 'Terminé', COMPLETED: 'Terminé',
      draft: 'Brouillon', DRAFT: 'Brouillon',
      published: 'Publié', PUBLISHED: 'Publié',
      archived: 'Archivé', ARCHIVED: 'Archivé'
    };
    return labels[status] || status;
  }

  statusClass(status: string): string {
    const s = status.toLowerCase();
    if (['active', 'published', 'completed'].includes(s)) return 'status-badge--success';
    if (['draft'].includes(s)) return 'status-badge--warning';
    if (['archived'].includes(s)) return 'status-badge--neutral';
    return 'status-badge--neutral';
  }

  goBack(): void {
    window.history.back();
  }
}