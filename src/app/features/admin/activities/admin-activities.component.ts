import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceComponent } from '../resource/admin-resource.component';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Activites',
  icon: 'bi-lightning-charge-fill',
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
    { key: 'category', label: 'Categorie' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Cree le', type: 'date' }
  ],
  fields: [
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Genere automatiquement si vide' },
    { key: 'excerpt', label: 'Resume', type: 'textarea' },
    { key: 'contentHtml', label: 'Contenu HTML', type: 'textarea' },
    { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
    { key: 'category', label: 'Categorie', type: 'text' },
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
export class AdminActivitiesComponent extends AdminResourceComponent {}
