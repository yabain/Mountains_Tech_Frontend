import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Hackathons',
  icon: 'bi-trophy-fill',
  endpoint: API_ROUTES.admin.hackathons,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  creatable: true,
  editable: true,
  deletable: true,
  createRoute: '/dashboard/hackathons/new',
  editorRoute: '/dashboard/hackathons',
  rowActions: [
    {
      kind: 'registrations',
      label: 'Inscriptions',
      icon: 'bi-people',
      route: '/dashboard/hackathons/:id/registrations'
    },
    { kind: 'edit', label: 'Modifier', icon: 'bi-pencil' },
    {
      kind: 'status',
      label: 'Archiver',
      icon: 'bi-archive',
      status: 'ARCHIVED',
      hideForStatuses: ['ARCHIVED']
    },
    { kind: 'delete', label: 'Supprimer', icon: 'bi-trash', tone: 'danger' }
  ],
  columns: [
    { key: 'title', label: 'Titre' },
    { key: 'startDate', label: 'Debut', type: 'date' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Créé le', type: 'date' }
  ],
  fields: [
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', placeholder: 'Genere automatiquement si vide' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'coverUrl', label: 'Image de couverture', type: 'url' },
    { key: 'startDate', label: 'Debut', type: 'date' },
    { key: 'endDate', label: 'Fin', type: 'date' },
    { key: 'registrationDeadline', label: "Date limite d'inscription", type: 'date' },
    { key: 'maxTeamSize', label: 'Taille max equipe', type: 'number' },
    { key: 'minTeamSize', label: 'Taille min equipe', type: 'number' },
    { key: 'themes', label: 'Themes', type: 'tags' },
    { key: 'prizes', label: 'Prix', type: 'tags' },
    { key: 'status', label: 'Statut', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }
  ]
};

@Component({
  selector: 'app-admin-hackathons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-hackathons.component.html',
  styleUrl: './admin-hackathons.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminHackathonsComponent extends AdminResourceBase {}
