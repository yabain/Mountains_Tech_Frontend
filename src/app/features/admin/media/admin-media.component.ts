import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceComponent } from '../resource/admin-resource.component';
import { API_ROUTES } from '../../../core/constants/api-routes';

const config: AdminResourceConfig = {
  title: 'Medias',
  icon: 'bi-images',
  endpoint: API_ROUTES.admin.media,
  shape: 'items',
  deletable: true,
  columns: [
    { key: 'originalName', label: 'Nom' },
    { key: 'alt', label: 'Texte alternatif' },
    { key: 'mimeType', label: 'Type' },
    { key: 'size', label: 'Taille' }
  ],
  fields: []
};

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../resource/admin-resource.component.html',
  styleUrl: '../resource/admin-resource.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminMediaComponent extends AdminResourceComponent {}
