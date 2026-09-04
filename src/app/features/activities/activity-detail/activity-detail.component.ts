import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  templateUrl: './activity-detail.component.html',
  styleUrl: './activity-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityDetailComponent {}
