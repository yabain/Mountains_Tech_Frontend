import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Newsletter',
  icon: 'bi-envelope-paper-fill',
  endpoint: API_ROUTES.admin.newsletter,
  shape: 'items',
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['SUBSCRIBED', 'UNSUBSCRIBED'],
  deletable: true,
  columns: [
    { key: 'email', label: 'Email' },
    { key: 'firstName', label: 'Prenom' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Inscrit le', type: 'date' }
  ],
  fields: []
};

@Component({
  selector: 'app-admin-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-newsletter.component.html',
  styleUrl: './admin-newsletter.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminNewsletterComponent extends AdminResourceBase {}
