import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../../resource/admin-resource.config';
import { AdminResourceBase } from '../../resource/admin-resource.base';
import { API_ROUTES } from '../../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Sections',
  icon: 'bi-grid',
  endpoint: API_ROUTES.admin.sections,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['active', 'inactive'],
  creatable: true,
  columns: [
    { key: 'name', label: 'Nom' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Créé le', type: 'date' }
  ],
  fields: [
    { key: 'name', label: 'Nom', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, placeholder: 'Sélectionner un type', options: ['Actualité', 'Événement', 'Projet', 'Ressource'] },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description de la section' },
    { key: 'isPublic', label: 'Visible publiquement', type: 'boolean' }
  ]
};

@Component({
  selector: 'app-admin-sections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sections.component.html',
  styleUrl: './admin-sections.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSectionsComponent extends AdminResourceBase {}