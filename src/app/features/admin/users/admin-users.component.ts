import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceComponent } from '../resource/admin-resource.component';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Utilisateurs',
  icon: 'bi-people-fill',
  endpoint: API_ROUTES.admin.users,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  creatable: true,
  editable: true,
  deletable: true,
  columns: [
    { key: 'firstName', label: 'Prénom' },
    { key: 'lastName', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rôle' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Créé le', type: 'date' }
  ],
  fields: [
    { key: 'firstName', label: 'Prénom', type: 'text', required: true },
    { key: 'lastName', label: 'Nom', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'password', label: 'Mot de passe', type: 'text', required: true, createOnly: true, placeholder: 'Minimum 8 caractères' },
    { key: 'role', label: 'Rôle', type: 'select', options: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'COMMUNICATION'] },
    { key: 'status', label: 'Statut', type: 'select', options: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }
  ]
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../resource/admin-resource.component.html',
  styleUrl: '../resource/admin-resource.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent extends AdminResourceComponent {}
