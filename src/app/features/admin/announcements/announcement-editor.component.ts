import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormControl, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxEditorModule, Editor, Toolbar, ToolbarItem } from 'ngx-editor';
import { finalize } from 'rxjs';
import DOMPurify from 'dompurify';

import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Announcement, AudienceFilter, AnnouncementRecipientCount } from '../../../core/models/announcement.interface';
import { ApiResponse } from '../../../core/models/api-response.interface';

@Component({
  selector: 'app-announcement-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgxEditorModule],
  templateUrl: './announcement-editor.component.html',
  styleUrl: './announcement-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnouncementEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['horizontal_rule', 'format_clear', 'indent', 'outdent'],
    ['undo', 'redo']
  ];

  isEditing = false;
  announcementId = '';
  announcement: Announcement | null = null;
  loading = true;
  saving = false;
  previewMode = false;

  // Form
  form = this.fb.nonNullable.group({
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    contentHtml: ['', Validators.required],
    // Scheduling
    scheduleType: ['immediate' as 'immediate' | 'scheduled'],
    scheduledAt: [''],
    // Audience
    audienceType: ['ALL' as AudienceFilter['type']],
    memberStatuses: [[] as string[]],
    eventIds: [[] as string[]],
    hackathonIds: [[] as string[]],
    customTags: [''],
    excludeUnsubscribed: [true]
  });

  // Options for audience filters
  memberStatusOptions = ['APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED'];
  events: { id: string; title: string }[] = [];
  hackathons: { id: string; title: string }[] = [];

  // Recipient count
  recipientCount = 0;
  countingRecipients = false;

  // Preview data
  previewData: { subject: string; contentHtml: string } | null = null;
  previewTab: 'desktop' | 'mobile' | 'email' = 'desktop';

  ngOnInit(): void {
    this.editor = new Editor();
    this.announcementId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditing = !!this.announcementId;

    this.loadReferenceData();
    if (this.isEditing) {
      this.loadAnnouncement();
    } else {
      this.loading = false;
      this.cdr.markForCheck();
    }

    // Auto-count recipients when audience changes
    this.form.valueChanges.subscribe(() => {
      this.debounceCountRecipients();
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  // Form control getters for template type safety
  get subjectCtrl(): FormControl { return this.form.get('subject') as FormControl; }
  get contentHtmlCtrl(): FormControl { return this.form.get('contentHtml') as FormControl; }
  get scheduleTypeCtrl(): FormControl { return this.form.get('scheduleType') as FormControl; }
  get scheduledAtCtrl(): FormControl { return this.form.get('scheduledAt') as FormControl; }
  get audienceTypeCtrl(): FormControl { return this.form.get('audienceType') as FormControl; }
  get memberStatusesCtrl(): FormControl { return this.form.get('memberStatuses') as FormControl; }
  get eventIdsCtrl(): FormControl { return this.form.get('eventIds') as FormControl; }
  get hackathonIdsCtrl(): FormControl { return this.form.get('hackathonIds') as FormControl; }
  get customTagsCtrl(): FormControl { return this.form.get('customTags') as FormControl; }
  get excludeUnsubscribedCtrl(): FormControl { return this.form.get('excludeUnsubscribed') as FormControl; }

  private loadReferenceData(): void {
    // Load events for audience filter
    this.api.get<ApiResponse<{ items: { id: string; title: string }[] }>>(API_ROUTES.admin.events, { status: 'PUBLISHED', limit: 100 })
      .subscribe({ next: (res) => { this.events = res.data?.items || []; } });

    // Load hackathons for audience filter
    this.api.get<ApiResponse<{ items: { id: string; title: string }[] }>>(API_ROUTES.admin.hackathons, { status: 'PUBLISHED', limit: 100 })
      .subscribe({ next: (res) => { this.hackathons = res.data?.items || []; } });
  }

  private loadAnnouncement(): void {
    this.api.get<ApiResponse<Announcement>>(adminDynamicRoutes.announcementRecipients(this.announcementId).replace('/recipients', ''))
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (res) => {
          this.announcement = res.data;
          this.patchForm(res.data);
        },
        error: () => {
          this.notification.error('Impossible de charger l\'annonce');
          this.router.navigate(['/dashboard/announcements']);
        }
      });
  }

  private patchForm(data: Announcement): void {
    this.form.patchValue({
      subject: data.subject,
      contentHtml: data.contentHtml,
      scheduleType: data.scheduledAt && data.status === 'SCHEDULED' ? 'scheduled' : 'immediate',
      scheduledAt: data.scheduledAt ? data.scheduledAt.slice(0, 16) : '',
      audienceType: data.audience?.type || 'ALL',
      memberStatuses: data.audience?.memberStatuses || [],
      eventIds: data.audience?.eventIds || [],
      hackathonIds: data.audience?.hackathonIds || [],
      customTags: data.audience?.customTags?.join(', ') || '',
      excludeUnsubscribed: data.audience?.excludeUnsubscribed ?? true
    });
    this.recipientCount = data.recipientCount || 0;
  }

  private buildAudienceFilter(): AudienceFilter {
    const v = this.form.getRawValue();
    return {
      type: v.audienceType,
      memberStatuses: v.memberStatuses?.length ? v.memberStatuses : undefined,
      eventIds: v.eventIds?.length ? v.eventIds : undefined,
      hackathonIds: v.hackathonIds?.length ? v.hackathonIds : undefined,
      customTags: v.customTags?.split(',').map(t => t.trim()).filter(Boolean) || undefined,
      excludeUnsubscribed: v.excludeUnsubscribed
    };
  }

  private buildPayload(): Partial<Announcement> {
    const v = this.form.getRawValue();
    const audience = this.buildAudienceFilter();
    const payload: Partial<Announcement> = {
      subject: v.subject,
      contentHtml: v.contentHtml,
      audience,
      status: 'DRAFT'
    };

    if (v.scheduleType === 'scheduled' && v.scheduledAt) {
      payload.status = 'SCHEDULED';
      payload.scheduledAt = new Date(v.scheduledAt).toISOString();
    }

    return payload;
  }

  // --- Actions ---
  saveDraft(): void {
    this.submit('DRAFT');
  }

  schedule(): void {
    if (this.form.get('scheduleType')?.value !== 'scheduled') {
      this.form.patchValue({ scheduleType: 'scheduled' });
      return;
    }
    this.submit('SCHEDULED');
  }

  sendNow(): void {
    this.submit('SENDING');
  }

  cancelScheduled(): void {
    if (!this.announcementId) return;
    if (!confirm('Annuler l\'envoi programmé ?')) return;

    this.api.post<ApiResponse<void>>(adminDynamicRoutes.announcementCancel(this.announcementId), {})
      .subscribe({
        next: () => {
          this.notification.error('Envoi programmé annulé');
          this.router.navigate(['/dashboard/announcements']);
        },
        error: () => this.notification.error('Impossible d\'annuler')
      });
  }

  private submit(targetStatus: 'DRAFT' | 'SCHEDULED' | 'SENDING'): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Vérifiez les champs obligatoires avant de continuer.');
      return;
    }

    if (targetStatus === 'SENDING') {
      if (!confirm(`Envoyer immédiatement à ${this.recipientCount} destinataire(s) ?`)) return;
    } else if (targetStatus === 'SCHEDULED') {
      if (!this.form.get('scheduledAt')?.value) {
        this.notification.error('Date d\'envoi requise');
        return;
      }
      if (!confirm(`Programmer l'envoi à ${this.recipientCount} destinataire(s) ?`)) return;
    }

    this.saving = true;
    const payload = this.buildPayload();
    payload.status = targetStatus;

    const request$ = this.isEditing
      ? this.api.patch<ApiResponse<Announcement>>(
          adminDynamicRoutes.announcementRecipients(this.announcementId).replace('/recipients', ''),
          payload
        )
      : this.api.post<ApiResponse<Announcement>>(API_ROUTES.admin.announcements, payload);

    request$.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (res) => {
          this.notification.success(targetStatus === 'DRAFT' ? 'Brouillon enregistré' :
            targetStatus === 'SCHEDULED' ? 'Envoi programmé' : 'Envoi lancé');
          this.router.navigate(['/dashboard/announcements']);
        },
        error: (err) => this.notification.error(err?.error?.message || 'Erreur lors de l\'enregistrement')
      });
  }

  // --- Preview ---
  openPreview(): void {
    const v = this.form.getRawValue();
    if (!v.subject || !v.contentHtml) {
      this.notification.error('Remplissez l\'objet et le contenu avant de prévisualiser');
      return;
    }
    this.previewData = { subject: v.subject, contentHtml: v.contentHtml };
    this.previewMode = true;
    this.cdr.markForCheck();
  }

  closePreview(): void {
    this.previewMode = false;
    this.previewData = null;
    this.cdr.markForCheck();
  }

  // --- Recipient count ---
  private debounceTimer: any;
  private debounceCountRecipients(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.countRecipients(), 500);
  }

  countRecipients(): void {
    if (this.countingRecipients) return;
    this.countingRecipients = true;
    this.cdr.markForCheck();

    const audience = this.buildAudienceFilter();
    this.api.post<ApiResponse<AnnouncementRecipientCount>>(adminDynamicRoutes.announcementRecipients(this.announcementId || 'preview'), audience)
      .pipe(finalize(() => { this.countingRecipients = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (res) => { this.recipientCount = res.data?.count || 0; },
        error: () => { this.recipientCount = 0; }
      });
  }

  // --- Helpers ---
  onMemberStatusChange(status: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.get('memberStatuses')?.value || [];
    const updated = checked ? [...current, status] : current.filter((s: string) => s !== status);
    this.form.patchValue({ memberStatuses: updated });
  }

  onEventChange(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.get('eventIds')?.value || [];
    const updated = checked ? [...current, id] : current.filter((s: string) => s !== id);
    this.form.patchValue({ eventIds: updated });
  }

  onHackathonChange(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.get('hackathonIds')?.value || [];
    const updated = checked ? [...current, id] : current.filter((s: string) => s !== id);
    this.form.patchValue({ hackathonIds: updated });
  }

  getAudienceDescription(): string {
    const v = this.form.getRawValue();
    switch (v.audienceType) {
      case 'ALL': return 'Tous les contacts (membres, newsletter, participants)';
      case 'MEMBERS': return `Membres${v.memberStatuses?.length ? ' (' + v.memberStatuses.join(', ') + ')' : ''}`;
      case 'NEWSLETTER': return 'Abonnés à la newsletter';
      case 'EVENT_PARTICIPANTS': return `Participants aux événements sélectionnés (${v.eventIds?.length || 0})`;
      case 'HACKATHON_TEAMS': return `Équipes de hackathon sélectionnées (${v.hackathonIds?.length || 0})`;
      case 'CUSTOM': return v.customTags ? `Tags personnalisés: ${v.customTags}` : 'Aucun tag défini';
      default: return '—';
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/announcements']);
  }

  get sanitizedContent(): string {
    if (!this.previewData?.contentHtml) return '';
    return DOMPurify.sanitize(this.previewData.contentHtml, {
      ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','strong','em','u','s','code','pre','blockquote','ul','ol','li','a','img','hr','div','span','table','thead','tbody','tr','th','td'],
      ALLOWED_ATTR: ['href','src','alt','style','class','target','rel']
    });
  }

  get nowISO(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
}