import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';

import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { NotificationService } from '../../../core/services/notification.service';

const config: AdminResourceConfig = {
  title: 'Prospects & Newsletter',
  icon: 'bi-people-fill',
  endpoint: API_ROUTES.admin.newsletter,
  shape: 'items',
  searchable: true,
  creatable: true,
  deletable: true,
  columns: [
    { key: 'firstName', label: 'Nom' },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'createdAt', label: "Date d'inscription", type: 'date' }
  ],
  fields: [
    { key: 'firstName', label: 'Nom', type: 'text', required: true },
    { key: 'email', label: 'E-mail', type: 'email', required: true },
    { key: 'phone', label: 'Téléphone', type: 'text' }
  ]
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
export class AdminNewsletterComponent extends AdminResourceBase {
  private readonly newsletterApi = inject(ApiService);
  private readonly newsletterNotification = inject(NotificationService);
  private readonly newsletterDestroyRef = inject(DestroyRef);

  displayName(row: Record<string, unknown>): string {
    return [row['firstName'], row['lastName']].filter(Boolean).join(' ') || String(row['name'] ?? '—');
  }

  downloadTemplate(): void {
    this.downloadCsv('modele-prospects.csv', ['firstName', 'lastName', 'email', 'phone'], []);
  }

  exportSubscribers(): void {
    const records = this.rows().map((row) => [
      row['firstName'] ?? row['name'] ?? '',
      row['lastName'] ?? '',
      row['email'] ?? '',
      row['phone'] ?? ''
    ]);
    this.downloadCsv('prospects-newsletter.csv', ['firstName', 'lastName', 'email', 'phone'], records);
  }

  async importSubscribers(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    try {
      const records = this.parseCsv(await file.text());
      if (!records.length || records.length > 500) {
        this.newsletterNotification.error('Le fichier doit contenir de 1 à 500 prospects.');
        return;
      }

      this.saving.set(true);
      from(records).pipe(
        concatMap((record) => this.newsletterApi.post<unknown>(API_ROUTES.admin.newsletter, record).pipe(
          map(() => true),
          catchError(() => of(false))
        )),
        toArray(),
        takeUntilDestroyed(this.newsletterDestroyRef)
      ).subscribe({
        next: (results) => {
          this.saving.set(false);
          const imported = results.filter(Boolean).length;
          const failed = results.length - imported;
          if (failed) {
            this.newsletterNotification.error(`${imported} prospect(s) importé(s), ${failed} échec(s). Vérifiez les lignes et réessayez.`);
          } else {
            this.newsletterNotification.success(`${imported} prospect(s) importé(s).`);
          }
          this.onSearchChange(this.search());
        },
        error: () => {
          this.saving.set(false);
          this.newsletterNotification.error('L’import des prospects a échoué.');
        }
      });
    } catch {
      this.newsletterNotification.error('Impossible de lire le fichier CSV.');
    }
  }

  private parseCsv(content: string): Record<string, string>[] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;

    for (let index = 0; index < content.length; index += 1) {
      const character = content[index];
      if (character === '"' && quoted && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        row.push(cell.trim());
        cell = '';
      } else if ((character === '\n' || character === '\r') && !quoted) {
        if (character === '\r' && content[index + 1] === '\n') {
          index += 1;
        }
        row.push(cell.trim());
        if (row.some(Boolean)) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += character;
      }
    }
    row.push(cell.trim());
    if (row.some(Boolean)) {
      rows.push(row);
    }
    if (quoted || rows.length < 2) {
      throw new Error('CSV invalide.');
    }

    const headers = rows[0].map((header) => header.replace(/^\uFEFF/, '').toLowerCase());
    const emailIndex = headers.indexOf('email');
    const firstNameIndex = headers.indexOf('firstname');
    const nameIndex = headers.indexOf('name');
    const lastNameIndex = headers.indexOf('lastname');
    const phoneIndex = headers.indexOf('phone');
    if (emailIndex < 0 || (firstNameIndex < 0 && nameIndex < 0)) {
      throw new Error('Colonnes CSV requises absentes.');
    }

    return rows.slice(1).map((values) => ({
      firstName: values[firstNameIndex >= 0 ? firstNameIndex : nameIndex] ?? '',
      lastName: values[lastNameIndex] ?? '',
      email: values[emailIndex] ?? '',
      phone: values[phoneIndex] ?? ''
    })).filter((record) => record['firstName'].trim() && record['email'].trim());
  }

  private downloadCsv(fileName: string, headers: string[], records: unknown[][]): void {
    const escape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...records].map((values) => values.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
