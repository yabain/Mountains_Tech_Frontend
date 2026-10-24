import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/http/api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class AdminAuditLogsComponent extends AdminResourceBase {
  private readonly userApi = inject(ApiService);
  readonly userNames = signal<Record<string, string>>({});

  constructor() {
    super();
    this.loadUsers();
  }

  private loadUsers(): void {
    this.userApi.get(API_ROUTES.admin.users).pipe(takeUntilDestroyed()).subscribe({
      next: (res: any) => {
        const list = res?.items ?? res?.data ?? res ?? [];
        const names: Record<string, string> = {};
        for (const u of Array.isArray(list) ? list : []) {
          const id = u?.id ?? u?._id ?? u?.userId ?? '';
          if (!id) continue;
          const first = String(u?.firstName ?? '').trim();
          const last = String(u?.lastName ?? '').trim();
          const full = first || last ? `${first} ${last}`.trim() : (String(u?.email ?? '') || id);
          names[String(id)] = full;
        }
        this.userNames.set(names);
      },
      error: () => this.userNames.set({})
    });
  }

  actorName(userId: string): string {
    if (!userId || userId === 'null' || userId === 'undefined') return '—';
    return this.userNames()[userId] ?? userId;
  }
}
