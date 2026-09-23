import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-state" aria-label="Chargement">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p class="loading-text">{{ message }}</p>
    </div>
  `,
  styleUrl: './loading-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingStateComponent {
  @Input() message = 'Chargement en cours...';
}