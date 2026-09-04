import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-member-list',
  standalone: true,
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberListComponent {}
