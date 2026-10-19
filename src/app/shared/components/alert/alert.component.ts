import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type AlertSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent {
  /** Variant of the alert (info, success, warning, error) */
  variant = input<AlertVariant>('info');

  /** Size of the alert */
  size = input<AlertSize>('medium');

  /** Automatically hide after specified milliseconds */
  autoHide = input<number | null>(null);

  /** Title of the alert */
  title = input<string>('');

  /** Message/content of the alert */
  message = input<string>('');

  /** Whether the alert is dismissible */
  dismissible = input<boolean>(true);

  /** Emitted when the user dismisses the alert */
  dismissed = output<void>();

  /** Emitted when the alert is auto-hidden */
  autoClosed = output<void>();

  private hideTimeout: any;

  /** Dismiss the alert */
  dismiss(): void {
    this.dismissed.emit();
    this.clearHideTimeout();
  }

  /** Auto-hide after duration */
  private startAutoHide(): void {
    this.clearHideTimeout();
    const duration = this.autoHide();
    if (duration && duration > 0) {
      this.hideTimeout = setTimeout(() => {
        this.autoClosed.emit();
        this.hideTimeout = null;
      }, duration);
    }
  }

  /** Clear any pending auto-hide timeout */
  private clearHideTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /** Track changes for auto-hide */
  protected onVariantChange(): void {
    this.startAutoHide();
  }
}