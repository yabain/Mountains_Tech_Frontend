import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hackathon-list',
  standalone: true,
  templateUrl: './hackathon-list.component.html',
  styleUrl: './hackathon-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HackathonListComponent {}
