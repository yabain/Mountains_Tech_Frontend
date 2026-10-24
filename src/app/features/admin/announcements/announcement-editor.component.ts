import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { finalize, map, Observable, switchMap } from 'rxjs';
import DOMPurify from 'dompurify';

import { API_ROUTES, adminDynamicRoutes } from '../../../core/constants/api-routes';
import { ApiService } from '../../../core/http/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Announcement, AnnouncementPreviewData } from '../../../core/models/announcement.interface';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-announcement-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxEditorModule],
  templateUrl: './announcement-editor.component.html',
  styleUrl: './announcement-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnouncementEditorComponent implements OnInit, OnDestroy {
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
    ['link'],
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
  errorMessage = '';
  recipientCount = 0;
  countingRecipients = false;

  form = this.fb.nonNullable.group({
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    contentHtml: ['', Validators.required],
    scheduleType: ['immediate' as 'immediate' | 'scheduled'],
    scheduledAt: ['']
  });

  previewData: AnnouncementPreviewData | null = null;
  previewTab: 'desktop' | 'mobile' = 'desktop';

  get subjectCtrl(): FormControl { return this.form.get('subject') as FormControl; }
  get contentHtmlCtrl(): FormControl { return this.form.get('contentHtml') as FormControl; }
  get scheduleTypeCtrl(): FormControl { return this.form.get('scheduleType') as FormControl; }
  get scheduledAtCtrl(): FormControl { return this.form.get('scheduledAt') as FormControl; }

  ngOnInit(): void {
    this.editor = new Editor();
    this.announcementId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditing = !!this.announcementId;

    this.countRecipients();
    if (this.isEditing) {
      this.loadAnnouncement();
    } else {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  private get detailUrl(): string {
    return `${API_ROUTES.admin.announcements}/${encodeURIComponent(this.announcementId)}`;
  }

  private loadAnnouncement(): void {
    this.api.get<ApiResponse<Announcement>>(this.detailUrl)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          const data = response?.data;
          if (!data) {
            this.errorMessage = 'Les informations de cette annonce sont indisponibles.';
            return;
          }
          this.announcement = data;
          this.form.patchValue({
            subject: data.subject || '',
            contentHtml: data.contentHtml || '',
            scheduleType: data.status === 'SCHEDULED' ? 'scheduled' : 'immediate',
            scheduledAt: data.scheduledAt ? data.scheduledAt.slice(0, 16) : ''
          });
          this.recipientCount = data.recipientCount ?? this.recipientCount;
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(error, 'Impossible de charger cette annonce.');
        }
      });
  }

  private buildPayload(): Record<string, unknown> {
    const value = this.form.getRawValue();
    return {
      subject: value.subject.trim(),
      contentHtml: value.contentHtml,
      audience: { groups: ['NEWSLETTER'] },
      sendMode: 'NOW'
    };
  }

  private persist(): Observable<string> {
    const payload = this.buildPayload();
    const request = this.isEditing
      ? this.api.patch<ApiResponse<Announcement>>(this.detailUrl, payload)
      : this.api.post<ApiResponse<Announcement>>(API_ROUTES.admin.announcements, payload);

    return request.pipe(map((response) => {
      const data = response?.data;
      return String((data as unknown as Record<string, unknown>)?.['id']
        ?? (data as unknown as Record<string, unknown>)?.['_id']
        ?? this.announcementId);
    }));
  }

  saveDraft(): void {
    if (!this.validateForm()) return;

    this.saving = true;
    this.persist()
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notification.success('Brouillon enregistré.');
          this.goBack();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(error, 'Impossible d’enregistrer le brouillon.');
        }
      });
  }

  schedule(): void {
    if (!this.validateForm()) return;
    const value = this.form.getRawValue();
    if (!value.scheduledAt) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Choisissez une date et une heure d’envoi.';
      return;
    }
    const sendAt = new Date(value.scheduledAt);
    if (!Number.isFinite(sendAt.getTime()) || sendAt.getTime() <= Date.now()) {
      this.errorMessage = 'La date d’envoi doit être dans le futur.';
      return;
    }
    if (!this.recipientCount) {
      this.errorMessage = 'Aucun abonné à la newsletter ne peut recevoir cette annonce.';
      return;
    }
    if (!confirm(`Programmer l’envoi à ${this.recipientCount} destinataire(s) ?`)) return;

    this.saving = true;
    this.persist()
      .pipe(
        switchMap((id) => this.api.post<ApiResponse<unknown>>(
          adminDynamicRoutes.announcementSchedule(id),
          { scheduledAt: sendAt.toISOString() }
        )),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.notification.success('Envoi programmé.');
          this.goBack();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(error, 'Impossible de programmer cet envoi.');
        }
      });
  }

  sendNow(): void {
    if (!this.validateForm()) return;
    if (!this.recipientCount) {
      this.errorMessage = 'Aucun abonné à la newsletter ne peut recevoir cette annonce.';
      return;
    }
    if (!confirm(`Envoyer immédiatement cette annonce à ${this.recipientCount} destinataire(s) ?`)) return;

    this.saving = true;
    this.persist()
      .pipe(
        switchMap((id) => this.api.post<ApiResponse<unknown>>(adminDynamicRoutes.announcementSend(id), {})),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.notification.success('Envoi lancé.');
          this.goBack();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(error, 'Impossible de lancer l’envoi.');
        }
      });
  }

  cancelScheduled(): void {
    if (!this.announcementId) return;
    if (!confirm('Annuler l’envoi programmé ?')) return;

    this.saving = true;
    this.api.post<ApiResponse<unknown>>(adminDynamicRoutes.announcementCancel(this.announcementId), {})
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notification.success('Envoi programmé annulé.');
          this.goBack();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(error, 'Impossible d’annuler cet envoi.');
        }
      });
  }

  countRecipients(): void {
    if (this.countingRecipients) return;
    this.countingRecipients = true;
    this.cdr.markForCheck();

    this.api.get<ApiResponse<{ pagination?: { total?: number }; total?: number }>>(
      API_ROUTES.admin.newsletter,
      { status: 'SUBSCRIBED', page: 1, limit: 1 }
    )
      .pipe(finalize(() => {
        this.countingRecipients = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.recipientCount = response?.data?.pagination?.total ?? response?.data?.total ?? 0;
        },
        error: () => {
          this.recipientCount = 0;
        }
      });
  }

  openPreview(): void {
    const value = this.form.getRawValue();
    if (!value.subject || !value.contentHtml) {
      this.errorMessage = 'Renseignez l’objet et le contenu avant de prévisualiser.';
      return;
    }
    this.previewData = { subject: value.subject, contentHtml: value.contentHtml };
    this.previewMode = true;
    this.cdr.markForCheck();
  }

  closePreview(): void {
    this.previewMode = false;
    this.previewData = null;
    this.cdr.markForCheck();
  }

  get sanitizedContent(): string {
    if (!this.previewData?.contentHtml) return '';
    return DOMPurify.sanitize(this.previewData.contentHtml, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'hr', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'target', 'rel']
    });
  }

  get nowISO(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/announcements']);
  }

  private validateForm(): boolean {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Vérifiez les champs obligatoires avant de continuer.';
      return false;
    }
    return true;
  }
}
