import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ROUTES } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Project, ProjectListData } from '../../../core/models/project.interface';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  searchTerm = '';
  isLoading = true;
  hasError = false;

  constructor(
    private api: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.get<ApiResponse<ProjectListData | Project[]>>(API_ROUTES.public.projects)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.projects = this.itemsFromResponse(response.data);
          this.changeDetectorRef.markForCheck();
        },
        error: () => {
          this.hasError = true;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  get filteredProjects(): Project[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.projects;
    }

    return this.projects.filter((project) => [
      project.name,
      project.title,
      project.description,
      project.excerpt,
      project.category,
      project.status
    ].some((value) => value?.toLowerCase().includes(term)));
  }

  projectTitle(project: Project): string {
    return project.title || project.name;
  }

  projectDescription(project: Project): string {
    return project.excerpt || project.description || 'Découvrez ce projet porté par MountainTech.';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'En cours',
      ACTIVE: 'En cours',
      completed: 'Terminé',
      COMPLETED: 'Terminé',
      draft: 'Brouillon',
      DRAFT: 'Brouillon',
      PUBLISHED: 'Publié',
      ARCHIVED: 'Archivé'
    };
    return labels[status] || status;
  }

  private itemsFromResponse(data: ProjectListData | Project[]): Project[] {
    return Array.isArray(data) ? data : data.items ?? [];
  }
}
