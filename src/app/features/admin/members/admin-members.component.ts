import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceComponent } from '../resource/admin-resource.component';
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
  editable: true,
  columns: [
    { key: 'companyName', label: 'Entreprise' },
    { key: 'representativeName', label: 'Représentant' },
    { key: 'representativeEmail', label: 'Email' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Créé le', type: 'date' }
  ],
  fields: []
};

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../resource/admin-resource.component.html',
  styleUrl: '../resource/admin-resource.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMembersComponent extends AdminResourceComponent {}
