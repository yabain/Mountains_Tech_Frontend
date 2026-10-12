import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceComponent } from '../resource/admin-resource.component';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Partenaires',
  icon: 'bi-building-fill',
  endpoint: API_ROUTES.admin.partners,
  shape: 'array',
  statusField: 'status',
  statusOptions: ['ACTIVE', 'INACTIVE'],
  statusEndpoint: '',
  creatable: true,
  editable: true,
  deletable: true,
  columns: [
    { key: 'name', label: 'Nom' },
    { key: 'type', label: 'Type' },
    { key: 'website', label: 'Site web' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'order', label: 'Ordre' }
  ],
  fields: [
    { key: 'name', label: 'Nom', type: 'text', required: true },
    { key: 'logoUrl', label: 'Logo', type: 'url' },
    { key: 'website', label: 'Site web', type: 'url' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'type', label: 'Type', type: 'select', options: ['INSTITUTIONAL', 'TECHNICAL', 'FINANCIAL', 'MEDIA'] },
    { key: 'status', label: 'Statut', type: 'select', options: ['ACTIVE', 'INACTIVE'] },
    { key: 'order', label: 'Ordre', type: 'number' }
  ]
};

@Component({
  selector: 'app-admin-partners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../resource/admin-resource.component.html',
  styleUrl: '../resource/admin-resource.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPartnersComponent extends AdminResourceComponent {}
