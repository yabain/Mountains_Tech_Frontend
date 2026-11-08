import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertComponent } from './shared/components/alert/alert.component';
import { NotificationService } from './core/services/notification.service';
import { PageTrackingService } from './core/services/page-tracking.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'MountainsTech';

  readonly notificationService = inject(NotificationService);

  constructor() {
    inject(PageTrackingService);
  }

  dismissNotification(id: number): void {
    this.notificationService.dismiss(id);
  }
}
