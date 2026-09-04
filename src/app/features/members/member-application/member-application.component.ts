import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-member-application',
  standalone: true,
  templateUrl: './member-application.component.html',
  styleUrl: './member-application.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberApplicationComponent {}
