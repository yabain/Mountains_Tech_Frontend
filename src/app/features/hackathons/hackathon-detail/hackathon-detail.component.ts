import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hackathon-detail',
  standalone: true,
  templateUrl: './hackathon-detail.component.html',
  styleUrl: './hackathon-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HackathonDetailComponent {}
