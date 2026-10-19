import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private readonly contactsRouter = inject(Router);

  openContact(row: Record<string, any>): void {
    void this.contactsRouter.navigate(['/dashboard/contacts', this.rowId(row)]);
  }
}
