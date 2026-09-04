import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  templateUrl: './activity-list.component.html',
  styleUrl: './activity-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityListComponent {}
