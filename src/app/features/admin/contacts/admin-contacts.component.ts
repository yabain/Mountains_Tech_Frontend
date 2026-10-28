import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Contacts',
  icon: 'bi-envelope-fill',
  endpoint: API_ROUTES.admin.contacts,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'],
  statusEndpoint: '/status',
  rowActions: [
    {
      kind: 'view',
      label: 'Voir',
      icon: 'bi-eye',
      route: '/dashboard/contacts/:id'
    },
    {
      kind: 'read',
      label: 'Marquer comme lu',
      icon: 'bi-envelope-open',
      tone: 'success',
      readField: 'isRead',
      readEndpoint: '/read',
      labelByReadState: {
        read: 'Marquer comme non lu',
        unread: 'Marquer comme lu'
      }
    }
  ],
  columns: [
    { key: 'name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'subject', label: 'Sujet' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Reçu le', type: 'date' }
  ],
  fields: []
};

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-contacts.component.html',
  styleUrl: './admin-contacts.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminContactsComponent extends AdminResourceBase {
  viewRow(row: any): void {
    this.router.navigate(['/dashboard/contacts', String(row.id ?? row._id)]);
  }
}
