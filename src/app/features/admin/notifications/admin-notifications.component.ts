import { ChangeDetectionStrategy, Component, HostListener, inject, output } from '@angular/core';
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
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}