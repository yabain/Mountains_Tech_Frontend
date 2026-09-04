import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-partners',
  standalone: true,
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnersComponent {}
