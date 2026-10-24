import { ChangeDetectionStrategy, Component, HostListener, effect, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardDataService } from '../dashboard/dashboard-data.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminNotificationsComponent {
  readonly close = output<void>();

  private readonly dataService = inject(DashboardDataService);
  readonly sections = this.dataService.sections;

  constructor() {
    this.dataService.load();
    effect(() => {
      if (!this.dataService.loading() && this.dataService.sections().length) {
        // Le panneau est ouvert : on mémorise la consultation sans vider la vue courante.
        this.dataService.markNotificationsSeen(false);
      }
    });
  }

  closePanel(): void {
    this.dataService.markNotificationsSeen();
    this.close.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closePanel();
    }
  }
}