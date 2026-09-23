import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a *ngIf="buttonAs === 'link'; else btn"
      class="btn"
      [ngClass]="'btn-' + variant"
      [href]="href"
      [target]="target"
      [rel]="rel">
      <ng-container *ngTemplateOutlet="content"></ng-container>
    </a>
    <ng-template #btn>
      <button [type]="type" class="btn" [ngClass]="'btn-' + variant">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>
    </ng-template>
    <ng-template #content><ng-content></ng-content></ng-template>
  `,
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'outline' = 'primary';
  @Input() buttonAs: 'button' | 'link' = 'button';
  @Input() href?: string;
  @Input() target?: string;
  @Input() rel?: string;
}