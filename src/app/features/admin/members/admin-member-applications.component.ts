import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceComponent } from '../resource/admin-resource.component';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: "Demandes d'adhesion",
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
  columns: [
    { key: 'companyName', label: 'Entreprise' },
    { key: 'representativeName', label: 'Représentant' },
    { key: 'representativeEmail', label: 'Email' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Reçu le', type: 'date' }
  ],
  fields: [
    { key: 'companyName', label: 'Entreprise', type: 'text', required: true },
    { key: 'legalForm', label: 'Forme juridique', type: 'text', placeholder: 'Ex. SARL' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: "Activite de l'entreprise" },
    { key: 'website', label: 'Site web', type: 'url' },
    { key: 'email', label: "Email de l'entreprise", type: 'email' },
    { key: 'phone', label: 'Telephone', type: 'text' },
    { key: 'address', label: 'Adresse', type: 'text' },
    { key: 'representativeName', label: 'Representant', type: 'text', required: true, placeholder: 'Nom Prenom' },
    { key: 'representativeEmail', label: 'Email du representant', type: 'email', required: true },
    { key: 'logoUrl', label: 'Logo', type: 'url', placeholder: 'https://cdn.example/logo.png' },
    { key: 'sectors', label: 'Secteurs', type: 'tags', placeholder: 'Ex. Fintech, EdTech' },
    { key: 'employees', label: 'Effectif', type: 'number' }
  ]
};

@Component({
  selector: 'app-admin-member-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../resource/admin-resource.component.html',
  styleUrl: '../resource/admin-resource.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMemberApplicationsComponent extends AdminResourceComponent {}
