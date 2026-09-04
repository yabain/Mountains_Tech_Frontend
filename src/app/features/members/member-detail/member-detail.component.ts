import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  templateUrl: './member-detail.component.html',
  styleUrl: './member-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberDetailComponent {}
