import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {}