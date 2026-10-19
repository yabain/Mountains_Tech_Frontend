import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Actualités',
  icon: 'bi-newspaper',
  endpoint: API_ROUTES.admin.activities,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  creatable: true,
  editable: true,
  deletable: true,
  columns: [
    { key: 'title', label: 'Titre' },
    { key: 'category', label: 'Catégorie' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Date', type: 'date' }
  ],
  fields: [
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Généré automatiquement si vide' },
    { key: 'excerpt', label: 'Résumé', type: 'textarea' },
    { key: 'contentHtml', label: 'Contenu HTML', type: 'textarea' },
    { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
    { key: 'category', label: 'Catégorie', type: 'text' },
    { key: 'status', label: 'Statut', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }
  ]
};

@Component({
  selector: 'app-admin-activities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-activities.component.html',
  styleUrl: './admin-activities.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminActivitiesComponent extends AdminResourceBase {
  private readonly activitiesRouter = inject(Router);
  readonly landingTextExpanded = signal(false);
  readonly categoriesDialogOpen = signal(false);
  readonly sectionVisible = signal(true);
  readonly navbarTitleVisible = signal(true);
  readonly landingDescription = signal('Découvrez les dernières actualités et les temps forts de Mountains Tech.');
  readonly landingRows = signal<Record<string, boolean>>({});

  readonly categories = computed(() => {
    const counts = new Map<string, number>();
    for (const row of this.rows()) {
      const category = String(row['category'] ?? '').trim();
      if (category) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  });

  override openCreate(): void {
    void this.activitiesRouter.navigate(['/dashboard/activities/new']);
  }

  override openEdit(row: Record<string, any>): void {
    void this.activitiesRouter.navigate(['/dashboard/activities', this.rowId(row), 'edit']);
  }

  toggleSectionVisibility(): void {
    this.sectionVisible.update((visible) => !visible);
  }

  toggleNavbarTitleVisibility(): void {
    this.navbarTitleVisible.update((visible) => !visible);
  }

  toggleLandingText(): void {
    this.landingTextExpanded.update((expanded) => !expanded);
  }

  toggleLanding(row: Record<string, any>): void {
    const id = this.rowId(row);
    this.landingRows.update((current) => ({
      ...current,
      [id]: !(current[id] ?? true)
    }));
  }

  isLandingVisible(row: Record<string, any>): boolean {
    return this.landingRows()[this.rowId(row)] ?? true;
  }

  dateLabel(row: Record<string, any>): string {
    const value = row['createdAt'] ?? row['date'];
    if (!value) {
      return '—';
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  statusLabel(row: Record<string, any>): string {
    const status = String(row['status'] ?? '').toUpperCase();
    if (status === 'PUBLISHED') {
      return 'Publié';
    }
    if (status === 'ARCHIVED') {
      return 'Archivé';
    }
    if (status === 'DRAFT') {
      return 'Brouillon';
    }
    return status || '—';
  }

  newsStatusClass(row: Record<string, any>): string {
    const status = String(row['status'] ?? '').toUpperCase();
    return `news-status news-status--${status.toLowerCase() || 'unknown'}`;
  }
}
