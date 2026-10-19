import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-email-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-email-settings.component.html',
  styleUrl: './admin-email-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEmailSettingsComponent {
  readonly smtpExpanded = signal(false);
  readonly emailSearch = signal('');
  testEmail = '';
  testSubject = 'Test e-mail';
  testMessage = 'Ceci est un e-mail de test.';

  toggleSmtp(): void {
    this.smtpExpanded.update((expanded) => !expanded);
  }
}
