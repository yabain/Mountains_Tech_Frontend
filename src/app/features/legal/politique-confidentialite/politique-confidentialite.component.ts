import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-politique-confidentialite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './politique-confidentialite.component.html',
  styleUrl: './politique-confidentialite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolitiqueConfidentialiteComponent {}