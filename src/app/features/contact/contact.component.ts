import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/http/api.service';
import { API_ROUTES } from '../../core/constants/api-routes';
import { ContactSubmission } from '../../core/models/contact.interface';
import { ApiResponse } from '../../core/models/api-response.interface';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
  private readonly api = inject(ApiService);
  private readonly notification = inject(NotificationService);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  subject = '';
  message = '';
  sent = false;
  sending = false;
  error = '';

  send(): void {
    if (this.sending) return;

    this.error = '';
    const payload: ContactSubmission = {
      name: `${this.firstName.trim()} ${this.lastName.trim()}`.trim(),
      email: this.email.trim(),
      subject: this.subject.trim() || 'Demande de contact',
      message: this.message.trim(),
      consent: true
    };

    this.sending = true;
    this.api.post<ApiResponse<ContactSubmission>>(API_ROUTES.public.contact, payload).subscribe({
      next: () => {
        this.sending = false;
        this.sent = true;
        this.notification.success('Message envoyé avec succès.');
      },
      error: () => {
        this.sending = false;
        this.error = "Votre message n'a pas pu être envoyé. Veuillez réessayer.";
      }
    });
  }

  reset(): void {
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.phone = '';
    this.subject = '';
    this.message = '';
    this.error = '';
    this.sent = false;
  }
}