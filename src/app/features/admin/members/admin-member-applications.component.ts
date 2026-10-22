import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: "Demandes d’adhésion",
  icon: 'bi-person-vcard-fill',
  endpoint: API_ROUTES.admin.memberApplications,
  createEndpoint: API_ROUTES.public.memberApplications,
  createDefaults: { consent: true },
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['PENDING', 'APPROVED', 'REJECTED'],
  statusEndpoint: '/status',
  creatable: true,
  createRoute: '/dashboard/members/applications/new',
  createLabel: 'Nouvelle demande',
  rowActions: [
    {
      kind: 'status',
      label: 'Approuver',
      icon: 'bi-check-lg',
      tone: 'success',
      status: 'APPROVED',
      hideForStatuses: ['APPROVED', 'REJECTED']
    },
    {
      kind: 'status',
      label: 'Refuser',
      icon: 'bi-x-lg',
      tone: 'danger',
      status: 'REJECTED',
      hideForStatuses: ['APPROVED', 'REJECTED']
    }
  ],
  columns: [
    { key: 'logoUrl', label: 'Logo', type: 'image' },
    { key: 'companyName', label: 'Entreprise' },
    { key: 'representativeName', label: 'Représentant' },
    { key: 'representativeEmail', label: 'Email' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Reçu le', type: 'date' }
  ],
  fields: [
    { key: 'companyName', label: 'Entreprise', type: 'text', required: true },
    { key: 'legalForm', label: 'Forme juridique', type: 'text', placeholder: 'Ex. SARL' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: "Activité de l’entreprise" },
    { key: 'website', label: 'Site web', type: 'url' },
    { key: 'email', label: "Email de l'entreprise", type: 'email' },
    { key: 'phone', label: 'Téléphone', type: 'text' },
    { key: 'address', label: 'Adresse', type: 'text' },
    { key: 'representativeName', label: 'Représentant', type: 'text', required: true, placeholder: 'Nom Prénom' },
    { key: 'representativeEmail', label: 'E-mail du représentant', type: 'email', required: true },
    { key: 'logoUrl', label: 'Logo', type: 'url', placeholder: 'https://cdn.example/logo.png' },
    { key: 'sectors', label: 'Secteurs', type: 'tags', placeholder: 'Ex. Fintech, EdTech' },
    { key: 'employees', label: 'Effectif', type: 'number' }
  ]
};

@Component({
  selector: 'app-admin-member-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-member-applications.component.html',
  styleUrl: './admin-member-applications.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMemberApplicationsComponent extends AdminResourceBase {}
