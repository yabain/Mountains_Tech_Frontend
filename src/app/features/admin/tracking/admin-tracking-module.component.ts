import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../../resource/admin-resource.config';
import { AdminResourceBase } from '../../resource/admin-resource.base';
import { API_ROUTES } from '../../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Module de Suivi',
  icon: 'bi-graph-up',
  endpoint: API_ROUTES.admin.tracking,
  shape: 'items',
  searchable: false,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['en cours', 'terminé', 'en attente'],
  creatable: false,
  columns: [
    { key: 'activity', label: 'Activité' },
    { key: 'count', label: 'Count', type: 'number' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'date', label: 'Date', type: 'date' }
  ],
  fields: [
    { key: 'activity', label: 'Activité', type: 'text', required: true },
    { key: 'count', label: 'Count', type: 'number', required: true },
    { key: 'status', label: 'Statut', type: 'select', required: true, placeholder: 'Sélectionner un statut', options: ['en cours', 'terminé', 'en attente'] },
    { key: 'date', label: 'Date', type: 'datetime', required: true }
  ]
};

@Component({
  selector: 'app-admin-tracking-module',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tracking-module.component.html',
  styleUrl: './admin-tracking-module.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTrackingModuleComponent extends AdminResourceBase {
  stats = [
    { id: 1, label: 'Membres', value: '128', icon: 'bi-people-fill' },
    { id: 2, label: 'Événements', value: '42', icon: 'bi-calendar-event' },
    { id: 3, label: 'Messages', value: '342', icon: 'bi-chat-dots' },
    { id: 4, label: 'Inscriptions', value: '89', icon: 'bi-person-plus' }
  ];

  chartData = [
    { day: 'Lun', count: 12 },
    { day: 'Mar', count: 18 },
    { day: 'Mer', count: 15 },
    { day: 'Jeu', count: 22 },
    { day: 'Ven', count: 28 },
    { day: 'Sam', count: 35 },
    { day: 'Dim', count: 27 }
  ];
}