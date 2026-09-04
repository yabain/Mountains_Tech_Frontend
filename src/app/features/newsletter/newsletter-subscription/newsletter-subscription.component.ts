import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-newsletter-subscription',
  standalone: true,
  templateUrl: './newsletter-subscription.component.html',
  styleUrl: './newsletter-subscription.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsletterSubscriptionComponent {}
