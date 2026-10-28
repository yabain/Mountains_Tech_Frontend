import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/http/api.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-newsletter-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter-subscription.component.html',
  styleUrl: './newsletter-subscription.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsletterSubscriptionComponent {
  private readonly api = inject(ApiService);
  readonly submitted = signal(false);
  readonly form = { email: '', firstName: '', consent: false };

  subscribe(): void {
    if (!this.form.email || !this.form.consent) return;
    this.api.post('/public/newsletter/subscriptions', {
      email: this.form.email,
      firstName: this.form.firstName || undefined,
      consent: this.form.consent
    }).subscribe({
      next: () => this.submitted.set(true),
      error: () => this.submitted.set(true) // message de succès même sur erreur temporaire
    });
  }
}
