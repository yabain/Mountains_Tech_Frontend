import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-team-registration',
  standalone: true,
  templateUrl: './team-registration.component.html',
  styleUrl: './team-registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamRegistrationComponent {}
