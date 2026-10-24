import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: "Journaux d'audit",
  icon: 'bi-journal-text',
  endpoint: API_ROUTES.admin.auditLogs,
  shape: 'items',
  columns: [
    { key: 'createdAt', label: 'Date', type: 'date' },
    { key: 'category', label: 'Catégorie' },
    { key: 'action', label: 'Action' },
    { key: 'userId', label: 'Acteur' },
    { key: 'method', label: 'Méthode' },
    { key: 'resource', label: 'Ressource' },
    { key: 'status', label: 'Statut' },
    { key: 'ip', label: 'IP' }
  ],
  fields: []
};

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-audit-logs.component.html',
  styleUrl: './admin-audit-logs.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAuditLogsComponent extends AdminResourceBase {}
