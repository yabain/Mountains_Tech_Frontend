import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../../resource/admin-resource.config';
import { AdminResourceBase } from '../../resource/admin-resource.base';
import { API_ROUTES } from '../../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Visibilité des États',
  icon: 'bi-eye',
  endpoint: API_ROUTES.admin.visibility,
  shape: 'items',
  searchable: false,
  statusParam: 'visibility',
  statusField: 'visibility',
  statusOptions: ['visible', 'caché', 'en lecture'],
  creatable: false,
  columns: [
    { key: 'name', label: 'Entité', type: 'text' },
    { key: 'visibility', label: 'Visibilité', type: 'status' },
    { key: 'lastUpdate', label: 'Dernière mise à jour', type: 'date' }
  ],
  fields: [
    { key: 'name', label: 'Entité', type: 'text', required: true },
    { key: 'visibility', label: 'Visibilité', type: 'select', required: true, placeholder: 'Sélectionner la visibilité', options: ['visible', 'caché', 'en lecture'] },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description de la configuration de visibilité' }
  ]
};

@Component({
  selector: 'app-admin-visibility-state',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-visibility-state.component.html',
  styleUrl: './admin-visibility-state.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminVisibilityStateComponent extends AdminResourceBase {
  entities = [
    { id: 1, name: 'Demandes d\'adhésion', icon: 'bi-person-vcard-fill', statusClass: 'bi-eye', statusLabel: 'Visible', isVisible: true, description: 'Les membres peuvent voir les demandes' },
    { id: 2, name: 'Actualités', icon: 'bi-newspaper', statusClass: 'bi-eye', statusLabel: 'Visible', isVisible: true, description: 'Les actualités sont visibles sur le tableau de bord' },
    { id: 3, name: 'Événements', icon: 'bi-calendar-event', statusClass: 'bi-eye', statusLabel: 'Visible', isVisible: true, description: 'Les événements sont affichés dans l agenda' },
    { id: 4, name: 'Partenaires', icon: 'bi-building-fill', statusClass: 'bi-eye', statusLabel: 'Visible', isVisible: true, description: 'Les partenaires sont répertoriés dans répertoire' },
    { id: 5, name: 'Ressources', icon: 'bi-folder', statusClass: 'bi-eye', statusLabel: 'Visible', isVisible: true, description: 'Les ressources sont accessibles aux utilisateurs' }
  ];

  showGlobalToggle = true;

  toggleVisibility(entityId: number) {
    const entity = this.entities.find(e => e.id === entityId);
    if (entity) {
      entity.isVisible = !entity.isVisible;
      entity.statusClass = entity.isVisible ? 'bi-eye' : 'bi-eye-off';
      entity.statusLabel = entity.isVisible ? 'Visible' : 'Caché';
    }
  }

  toggleAllVisibility() {
    const allVisible = this.entities.every(e => e.isVisible);
    this.entities.forEach(entity => {
      entity.isVisible = !allVisible;
      entity.statusClass = entity.isVisible ? 'bi-eye' : 'bi-eye-off';
      entity.statusLabel = entity.isVisible ? 'Visible' : 'Caché';
    });
  }
}