import { Directive, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RESOURCE_CONFIG, ResourceField, ResourceListColumn, ResourceRowAction } from './admin-resource.config';
import { environment } from '../../../../environments/environment';
import { apiErrorMessage } from '../../../core/utils/api-error';

type Row = Record<string, any>;

@Directive()
export abstract class AdminResourceBase {
  protected readonly api = inject(ApiService);
  protected readonly router = inject(Router);
  protected readonly notification = inject(NotificationService);
  private readonly rowActionDestroyRef = inject(DestroyRef);

  readonly config = inject(RESOURCE_CONFIG);

  readonly rows = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly reloading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly search = signal('');
  readonly selectedStatus = signal(this.config.defaultStatus ?? '');
  readonly resourceStatusFilter = signal('');

  readonly resourceRows = computed(() => {
    const status = this.resourceStatusFilter();
    const field = this.config.statusField;
    return !status || !field
      ? this.rows()
      : this.rows().filter((row) => String(row[field] ?? '').toUpperCase() === status);
  });

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

  resourceStatusCount(status: string): number {
    const field = this.config.statusField;
    return field
      ? this.rows().filter((row) => String(row[field] ?? '').toUpperCase() === status).length
      : 0;
  }

  setResourceStatusFilter(status: string): void {
    this.resourceStatusFilter.set(status);
  }

  resourceStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      ARCHIVED: 'Archivé',
      DRAFT: 'Brouillon',
      INACTIVE: 'Inactif',
      PUBLISHED: 'Publié',
      SUSPENDED: 'Suspendu',
      NEW: 'Nouveau',
      IN_PROGRESS: 'En cours',
      RESOLVED: 'Résolu',
      SPAM: 'Indésirable',
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
      SUBSCRIBED: 'Abonné',
      UNSUBSCRIBED: 'Désabonné',
      SCHEDULED: 'Programmé',
      PROCESSING: 'En cours d’envoi',
      SENDING: 'En cours d’envoi',
      SENT: 'Envoyé',
      FAILED: 'Échec',
      CANCELLED: 'Annulé'
    };
    return labels[status] ?? status.replace(/_/g, ' ').toLowerCase();
  }

  resourceOptionLabel(option: string | number): string {
    const value = String(option);
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super administrateur',
      ADMIN: 'Administrateur',
      EDITOR: 'Rédacteur',
      COMMUNICATION: 'Communication',
      INSTITUTIONAL: 'Institutionnel',
      TECHNICAL: 'Technique',
      FINANCIAL: 'Financier',
      MEDIA: 'Médias',
      true: 'Oui',
      false: 'Non'
    };
    return labels[value] ?? this.resourceStatusLabel(value);
  }

  resourceStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      ACTIVE: 'bi-check-circle-fill',
      ARCHIVED: 'bi-archive-fill',
      DRAFT: 'bi-file-earmark-text',
      INACTIVE: 'bi-ban',
      PUBLISHED: 'bi-globe2',
      SUSPENDED: 'bi-pause-circle-fill'
    };
    return icons[status] ?? 'bi-circle';
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
    if (this.config.rowActions) {
      return this.config.rowActions.length > 0;
    }
    return this.hasCreate() || this.hasEdit() || (this.config.deletable ?? false) || this.hasStatusControl;
  }

  rowActionsFor(row: Row): ResourceRowAction[] {
    const actions = this.config.rowActions;
    if (!actions) return [];
    const status = this.rowStatus(row).toUpperCase();
    return actions.filter((action) => {
      if (action.hideForStatuses?.includes(status)) return false;
      return !action.showWhenField || row[action.showWhenField] === action.showWhenValue;
    });
  }

  rowActionLabel(action: ResourceRowAction, row: Row): string {
    if (action.kind === 'read') {
      const field = action.readField ?? 'isRead';
      return action.labelByReadState?.[row[field] === true ? 'read' : 'unread'] ?? action.label;
    }
    return action.labelByStatus?.[this.rowStatus(row).toUpperCase()] ?? action.label;
  }

  rowActionIsSuccess(action: ResourceRowAction, row: Row): boolean {
    if (action.kind === 'read') {
      return action.tone === 'success' && row[action.readField ?? 'isRead'] === true;
    }
    return action.tone === 'success';
  }

  runRowAction(action: ResourceRowAction, row: Row): void {
    if (!row || !this.rowId(row)) return;
    if (action.confirmMessage && !confirm(action.confirmMessage)) return;

    switch (action.kind) {
      case 'edit':
        this.openEdit(row);
        return;
      case 'delete':
        this.openDelete(row);
        return;
      case 'status': {
        const currentStatus = this.rowStatus(row).toUpperCase();
        const targetStatus = action.statusByCurrentStatus?.[currentStatus] ?? action.status;
        if (targetStatus) this.changeStatus(row, targetStatus);
        return;
      }
      case 'read':
        this.toggleRead(row, action);
        return;
      case 'view':
      case 'registrations':
        if (action.route) {
          const route = action.route.replace(':id', encodeURIComponent(this.rowId(row)));
          void this.router.navigateByUrl(route);
        }
        return;
    }
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

  jsonValue(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2);
  }

  mediaUrl(value: unknown): string {
    const path = String(value ?? '').trim();
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return new URL(path.startsWith('/') ? path : `/${path}`, environment.apiUrl).toString();
  }

  isImageMedia(row: Row): boolean {
    return String(row['mimeType'] ?? '').toLowerCase().startsWith('image/');
  }

  isVideoMedia(row: Row): boolean {
    return String(row['mimeType'] ?? '').toLowerCase().startsWith('video/');
  }

  cellValue(row: Row, column: ResourceListColumn): string {
    if (!row) {
      return '-';
    }
    if (column.type === 'read') {
      return row[column.key] === true ? 'Lu' : 'Non lu';
    }
    if (column.type === 'status') {
      return this.resourceStatusLabel(String(row[column.key] ?? '').toUpperCase());
    }
    if (column.key === 'resource') {
      const resources: Record<string, string> = {
        activities: 'Actualités',
        announcements: 'Annonces',
        contacts: 'Contacts',
        events: 'Événements',
        hackathons: 'Hackathons',
        members: 'Membres',
        media: 'Médias',
        newsletter: 'Newsletter',
        partners: 'Partenaires',
        projects: 'Projets',
        users: 'Comptes'
      };
      const resource = String(row[column.key] ?? '');
      return resources[resource] ?? resource;
    }
    if (column.key === 'action' && this.config.endpoint.includes('/audit-logs')) {
      const actions: Record<string, string> = {
        GET: 'Consultation',
        POST: 'Création ou envoi',
        PATCH: 'Modification',
        PUT: 'Mise à jour',
        DELETE: 'Suppression'
      };
      const action = String(row[column.key] ?? '').toUpperCase();
      return actions[action] ?? action;
    }
    return this.formatCell(row?.[column.key], column.type);
  }

  readStatusClass(row: Row, field: string): string {
    return row?.[field] === true
      ? 'res-status res-status--success'
      : 'res-status res-status--pending';
  }

  statusClass(status: unknown): string {
    const label = String(status ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_');
    if (['approved', 'published', 'active', 'resolved', 'subscribed', 'confirmed'].includes(label)) {
      return 'res-status res-status--success';
    }
    if (['pending', 'new', 'in_review', 'en_attente', 'en_cours'].includes(label)) {
      return 'res-status res-status--pending';
    }
    if (['rejected', 'declined', 'failed', 'refused', 'refuse', 'echec', 'spam', 'inactive', 'suspended', 'archived', 'unsubscribed'].includes(label)) {
      return 'res-status res-status--danger';
    }
    if (['cancelled', 'canceled', 'annule', 'annulee'].includes(label)) {
      return 'res-status res-status--cancelled';
    }
    if (['draft', 'brouillon'].includes(label)) {
      return 'res-status res-status--neutral';
    }
    if (['in_progress', 'en_cours_de_realisation'].includes(label)) {
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
    if (this.config.editorRoute) {
      void this.router.navigateByUrl(`${this.config.editorRoute}/${encodeURIComponent(this.rowId(row))}/edit`);
      return;
    }
    const draft: Row = {};
    for (const field of this.config.fields) {
      let value = row?.[field.key];
      if (field.type === 'tags') {
        value = this.tagsInputValue(value, field.key);
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
      ? `${this.config.endpoint}/${encodeURIComponent(id)}/status`
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

  private toggleRead(row: Row, action: ResourceRowAction): void {
    const id = this.rowId(row);
    const field = action.readField ?? 'isRead';
    const nextValue = row[field] !== true;
    const readEndpoint = action.readEndpoint;
    if (!readEndpoint) {
      this.notification.error('Action de lecture non configurée.');
      return;
    }

    this.statusBusyId.set(id);
    this.api.patch<unknown>(`${this.config.endpoint}/${encodeURIComponent(id)}${readEndpoint}`, { [field]: nextValue })
      .pipe(takeUntilDestroyed(this.rowActionDestroyRef))
      .subscribe({
        next: () => {
          this.rows.update((entries) => entries.map((entry) =>
            this.rowId(entry) === id ? { ...entry, [field]: nextValue } : entry
          ));
          this.statusBusyId.set('');
          this.notification.success(nextValue ? 'Message marqué comme lu.' : 'Message marqué comme non lu.');
        },
        error: (error: unknown) => {
          this.statusBusyId.set('');
          this.notification.error(apiErrorMessage(error, 'Impossible de modifier le statut de lecture.'));
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

  private tagsInputValue(value: unknown, fieldKey: string): string {
    if (!Array.isArray(value)) {
      return String(value ?? '');
    }

    return value
      .map((item) => {
        if (fieldKey === 'partners' && typeof item === 'object' && item !== null) {
          const partner = item as Record<string, unknown>;
          return String(partner['_id'] ?? partner['id'] ?? '');
        }
        return String(item);
      })
      .filter(Boolean)
      .join(', ');
  }

  protected load(soft = false): void {
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