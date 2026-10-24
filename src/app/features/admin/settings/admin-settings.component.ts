import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Paramètres',
  icon: 'bi-gear-fill',
  endpoint: API_ROUTES.admin.settings,
  shape: 'array',
  columns: [
    { key: 'key', label: 'Cle' },
    { key: 'value', label: 'Valeur' },
    { key: 'isPublic', label: 'Public', type: 'boolean' }
  ],
  fields: []
};

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSettingsComponent extends AdminResourceBase {}
