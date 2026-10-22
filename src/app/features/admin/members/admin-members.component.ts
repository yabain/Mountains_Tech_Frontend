import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Membres',
  icon: 'bi-person-badge-fill',
  endpoint: API_ROUTES.admin.members,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
  statusEndpoint: '/status',
  rowActions: [
    {
      kind: 'status',
      label: 'Désactiver',
      icon: 'bi-person-slash',
      tone: 'default',
      status: 'SUSPENDED',
      statusByCurrentStatus: { SUSPENDED: 'APPROVED' },
      labelByStatus: { SUSPENDED: 'Activer' },
      hideForStatuses: ['PENDING', 'REJECTED']
    }
  ],
  columns: [
    { key: 'logoUrl', label: 'Logo', type: 'image' },
    { key: 'companyName', label: 'Entreprise' },
    { key: 'representativeName', label: 'Représentant' },
    { key: 'representativeEmail', label: 'Email' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Créé le', type: 'date' }
  ],
  fields: [
    { key: 'companyName', label: 'Entreprise', type: 'text', required: true },
    { key: 'legalForm', label: 'Forme juridique', type: 'text' },
    { key: 'representativeName', label: 'Représentant', type: 'text', required: true },
    { key: 'representativeEmail', label: 'E-mail du représentant', type: 'email', required: true },
    { key: 'email', label: 'E-mail de l’entreprise', type: 'email' },
    { key: 'phone', label: 'Téléphone', type: 'text' },
    { key: 'website', label: 'Site web', type: 'url' },
    { key: 'address', label: 'Adresse', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'sectors', label: 'Secteurs', type: 'tags' },
    { key: 'employees', label: 'Effectif', type: 'number' }
  ]
};

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-members.component.html',
  styleUrl: './admin-members.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMembersComponent extends AdminResourceBase {}
