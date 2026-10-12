import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceComponent } from '../resource/admin-resource.component';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Evenements',
  icon: 'bi-calendar-event-fill',
  endpoint: API_ROUTES.admin.events,
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
    { key: 'location', label: 'Lieu' },
    { key: 'startAt', label: 'Debut', type: 'date' },
    { key: 'status', label: 'Statut', type: 'status' }
  ],
  fields: [
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Genere automatiquement si vide' },
    { key: 'excerpt', label: 'Resume', type: 'textarea' },
    { key: 'contentHtml', label: 'Contenu HTML', type: 'textarea' },
    { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
    { key: 'category', label: 'Categorie', type: 'text' },
    { key: 'location', label: 'Lieu', type: 'text' },
    { key: 'startAt', label: 'Debut', type: 'datetime', required: true },
    { key: 'endAt', label: 'Fin', type: 'datetime' },
    { key: 'registrationRequired', label: 'Inscription requise', type: 'select', options: ['true', 'false'] },
    { key: 'capacity', label: 'Capacite', type: 'number' },
    { key: 'status', label: 'Statut', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }
  ]
};

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEventsComponent extends AdminResourceComponent {}
