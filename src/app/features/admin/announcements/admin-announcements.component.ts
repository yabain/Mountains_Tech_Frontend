import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Annonces',
  icon: 'bi-megaphone-fill',
  endpoint: API_ROUTES.admin.announcements,
  shape: 'items',
  columns: [
    { key: 'subject', label: 'Objet' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'recipientCount', label: 'Destinataires' },
    { key: 'createdAt', label: 'Créée le', type: 'date' }
  ],
  fields: [],
  creatable: true,
  editable: false,
  deletable: false,
  createRoute: '/dashboard/announcements/new'
};

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-announcements.component.html',
  styleUrl: './admin-announcements.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAnnouncementsComponent extends AdminResourceBase {}
