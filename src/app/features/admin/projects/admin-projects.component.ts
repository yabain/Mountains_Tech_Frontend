import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Projets',
  icon: 'bi-kanban-fill',
  endpoint: API_ROUTES.admin.projects,
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
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Cree le', type: 'date' }
  ],
  fields: [
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Genere automatiquement si vide' },
    { key: 'excerpt', label: 'Resume', type: 'textarea' },
    { key: 'contentHtml', label: 'Contenu HTML', type: 'textarea' },
    { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
    { key: 'startDate', label: 'Debut', type: 'date' },
    { key: 'endDate', label: 'Fin', type: 'date' },
    { key: 'tags', label: 'Tags', type: 'tags' },
    { key: 'status', label: 'Statut', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }
  ]
};

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-projects.component.html',
  styleUrl: './admin-projects.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProjectsComponent extends AdminResourceBase {}
