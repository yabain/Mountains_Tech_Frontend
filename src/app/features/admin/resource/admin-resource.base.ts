import { Directive, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RESOURCE_CONFIG, ResourceField, ResourceListColumn } from './admin-resource.config';

type Row = Record<string, any>;

@Directive()
export abstract class AdminResourceBase {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  readonly config = inject(RESOURCE_CONFIG);

  readonly rows = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly reloading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly search = signal('');
  readonly selectedStatus = signal('');

  readonly page = signal(1);
  readonly limit = signal(10);
  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly total = signal(0);
  readonly pages = signal(1);

  readonly modalMode = signal<'none' | 'create' | 'edit' | 'delete'>('none');
  readonly form = signal<Row>({});
  readonly editingId = signal('');
  readonly deletingRow = signal<Row | null>(null);
  readonly statusBusyId = signal('');

  readonly modalTitle = signal('');

  constructor() {
    this.load();
  }

  get isPaginated(): boolean {
    return this.config.shape === 'items';
  }

  get statusOptions(): string[] {
    return this.config.statusOptions ?? [];
  }

  get showStatusFilter(): boolean {
    return !!this.config.statusParam && (this.config.statusOptions?.length ?? 0) > 0;
  }

  get hasStatusControl(): boolean {
    return !!this.config.statusField && (this.config.statusOptions?.length ?? 0) > 0;
  }

  searchable(): boolean {
    return (this.config.searchable ?? true) && !!this.config.endpoint;
  }

  showActionsColumn(): boolean {
    return this.hasCreate() || this.hasEdit() || (this.config.deletable ?? false) || this.hasStatusControl;
  }

  hasCreate(): boolean {
    return (this.config.creatable ?? false) && (this.config.fields.length > 0 || !!this.config.createRoute);
  }

  hasEdit(): boolean {
    return (this.config.editable ?? false) && this.config.fields.length > 0;
  }

  fieldsForForm(): ResourceField[] {
    const isEdit = this.modalMode() === 'edit';
    return this.config.fields.filter((field) => !(field.createOnly && isEdit));
  }

  rowId(row: Row): string {
    return String(row?.['id'] ?? row?.['_id'] ?? '');
  }

  rowStatus(row: Row): string {
    const statusField = this.config.statusField;
    return statusField ? String(row?.[statusField] ?? '') : '';
  }

  cellValue(row: Row, column: ResourceListColumn): string {
    if (!row) {
      return '-';
    }
    return this.formatCell(row?.[column.key], column.type);
  }

  statusClass(status: unknown): string {
    const label = String(status ?? '').toLowerCase();
    if (['approved', 'published', 'active', 'resolved', 'subscribed', 'confirmed'].includes(label)) {
      return 'res-status res-status--success';
    }
    if (['pending', 'new'].includes(label)) {
      return 'res-status res-status--pending';
    }
    if (['rejected', 'spam', 'inactive', 'suspended', 'archived', 'unsubscribed', 'cancelled'].includes(label)) {
      return 'res-status res-status--danger';
    }
    if (['in_progress', 'draft'].includes(label)) {
      return 'res-status res-status--info';
    }
    return 'res-status res-status--neutral';
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.load(true);
  }

  onStatusFilterChange(value: string): void {
    this.selectedStatus.set(value);
    this.page.set(1);
    this.load(true);
  }

  onPageSizeChange(value: string): void {
    const limit = Number(value);
    if (!this.pageSizeOptions.includes(limit)) {
      return;
    }
    this.limit.set(limit);
    this.page.set(1);
    this.load(true);
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((page) => page - 1);
      this.load(true);
    }
  }

  nextPage(): void {
    if (this.page() < this.pages()) {
      this.page.update((page) => page + 1);
      this.load(true);
    }
  }

  openCreate(): void {
    if (this.config.createRoute) {
      this.router.navigate([this.config.createRoute]);
      return;
    }
    const initial: Row = {};
    for (const field of this.config.fields) {
      if (field.type === 'tags') {
        initial[field.key] = [];
      } else if (field.type === 'select' && (field.options?.length ?? 0) > 0) {
        initial[field.key] = field.options![0];
      } else {
        initial[field.key] = '';
      }
    }
    this.form.set(initial);
    this.editingId.set('');
    this.modalTitle.set(`Nouveau · ${this.config.title}`);
    this.modalMode.set('create');
  }

  openEdit(row: Row): void {
    const draft: Row = {};
    for (const field of this.config.fields) {
      let value = row?.[field.key];
      if (field.type === 'tags') {
        value = Array.isArray(value) ? value.join(', ') : (value ?? '');
      } else if (field.type === 'date') {
        value = this.toDateInput(String(value ?? ''));
      } else if (field.type === 'datetime') {
        value = this.toDateTimeInput(String(value ?? ''));
      } else if (value === null || value === undefined) {
        value = '';
      }
      draft[field.key] = value;
    }
    this.form.set(draft);
    this.editingId.set(this.rowId(row));
    this.modalTitle.set(`Modifier · ${this.config.title}`);
    this.modalMode.set('edit');
  }

  openDelete(row: Row): void {
    this.deletingRow.set(row);
    this.modalMode.set('delete');
  }

  closeModal(): void {
    if (this.saving()) {
      return;
    }
    this.modalMode.set('none');
  }

  submitForm(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const isEdit = this.modalMode() === 'edit' && !!this.editingId();
    let payload = this.buildPayload();
    if (!isEdit && this.config.createDefaults) {
      payload = { ...this.config.createDefaults, ...payload };
    }
    const request$ = isEdit
      ? this.api.patch<unknown>(this.withId(this.config.endpoint, this.editingId()), payload)
      : this.api.post<unknown>(this.config.createEndpoint ?? this.config.endpoint, payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success(isEdit ? 'Élément mis à jour.' : 'Élément créé.');
        this.modalMode.set('none');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err) ?? "Une erreur est survenue lors de l'enregistrement.");
      }
    });
  }

  confirmDelete(): void {
    if (this.saving()) {
      return;
    }
    const id = this.rowId(this.deletingRow() ?? {});
    if (!id) {
      this.modalMode.set('none');
      return;
    }
    this.saving.set(true);
    this.api.delete<unknown>(this.withId(this.config.endpoint, id)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success('Élément supprimé.');
        this.modalMode.set('none');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.extractErrorMessage(err) ?? 'Suppression impossible.');
      }
    });
  }

  changeStatus(row: Row, status: string): void {
    if (!row || !status) {
      return;
    }
    const id = this.rowId(row);
    this.statusBusyId.set(id);
    const endpoint = this.config.statusEndpoint === '/status'
      ? `${this.config.endpoint}/${id}/status`
      : this.withId(this.config.endpoint, id);

    this.api.patch<unknown>(endpoint, { status }).subscribe({
      next: () => {
        this.statusBusyId.set('');
        this.notification.success('Statut mis à jour.');
        this.load();
      },
      error: () => {
        this.statusBusyId.set('');
        this.notification.error('Impossible de mettre à jour le statut.');
      }
    });
  }

  private buildPayload(): Row {
    const payload: Row = {};
    for (const field of this.config.fields) {
      if (field.createOnly && this.modalMode() === 'edit') {
        continue;
      }
      let value = this.form()[field.key];
      if (field.type === 'tags') {
        value = String(value ?? '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
      } else if (field.type === 'number') {
        value = value === '' || value === null ? undefined : Number(value);
      } else if (field.type === 'select' && field.options?.includes('true') && typeof value === 'string') {
        value = value === 'true';
      } else if (field.type === 'datetime' && value) {
        value = new Date(value).toISOString();
      }
      if (value !== undefined && value !== '') {
        payload[field.key] = value;
      }
    }
    return payload;
  }

  private load(soft = false): void {
    if (soft) {
      this.reloading.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set('');

    const params: Record<string, unknown> = { page: this.page(), limit: this.limit() };
    if (this.searchable() && this.search()) {
      params['search'] = this.search();
    }
    if (this.config.statusParam && this.selectedStatus()) {
      params[this.config.statusParam] = this.selectedStatus();
    }

    this.api.get<unknown>(this.config.endpoint, params).subscribe({
      next: (response) => {
        const extracted = this.extract(response);
        this.rows.set(extracted.items);
        this.total.set(extracted.pagination.total);
        this.pages.set(extracted.pagination.pages > 0 ? extracted.pagination.pages : 1);
        this.loading.set(false);
        this.reloading.set(false);
      },
      error: () => {
        this.error.set(`Impossible de charger ${this.config.title.toLowerCase()}.`);
        this.loading.set(false);
        this.reloading.set(false);
      }
    });
  }

  private extract(response: unknown): { items: Row[]; pagination: { total: number; pages: number } } {
    if (Array.isArray(response)) {
      const items = response.filter((item) => this.isObject(item)).map((item) => item as Row);
      return { items, pagination: { total: items.length, pages: 1 } };
    }

    if (this.isObject(response)) {
      const data = response['data'];
      if (Array.isArray(data)) {
        const items = data.filter((item) => this.isObject(item)).map((item) => item as Row);
        return { items, pagination: { total: items.length, pages: 1 } };
      }
      if (this.isObject(data) && Array.isArray(data['items'])) {
        const items = data['items'].filter((item) => this.isObject(item)).map((item) => item as Row);
        const pagination = this.isObject(data['pagination']) ? data['pagination'] : {};
        return {
          items,
          pagination: { total: Number(pagination['total'] ?? 0), pages: Number(pagination['pages'] ?? 1) }
        };
      }
    }

    return { items: [], pagination: { total: 0, pages: 1 } };
  }

  private withId(endpoint: string, id: string): string {
    return id ? `${endpoint}/${id}` : endpoint;
  }

  private formatCell(value: unknown, type?: string): string {
    switch (type) {
      case 'date':
        return this.formatDate(value);
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'tags':
        return Array.isArray(value) ? value.join(', ') : String(value ?? '-');
      default:
        return this.displayText(value);
    }
  }

  private formatDate(value: unknown): string {
    if (!value) {
      return '-';
    }
    const date = new Date(String(value));
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('fr-FR');
  }

  private displayText(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    const text = String(value);
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
  }

  private toDateInput(value: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
  }

  private toDateTimeInput(value: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private extractErrorMessage(err: unknown): string {
    const errorObj = (err as any)?.error;
    if (this.isObject(errorObj)) {
      const message = errorObj['message'];
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message)) {
        return message.map((entry) => String(entry)).join(' · ');
      }
    }
    return '';
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}