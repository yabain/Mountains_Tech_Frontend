import { Injectable, signal } from '@angular/core';

export type NotificationVariant = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  variant: NotificationVariant;
  message: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly notifications = signal<readonly AppNotification[]>([]);
  private nextId = 0;

  success(message: string): void {
    this.add('success', message, 5000);
  }

  error(message: string): void {
    this.add('error', message, 7000);
  }

  info(message: string): void {
    this.add('info', message, 5000);
  }

  warning(message: string): void {
    this.add('warning', message, 6000);
  }

  dismiss(id: number): void {
    this.notifications.update((notifications) => notifications.filter((notification) => notification.id !== id));
  }

  private add(variant: NotificationVariant, message: string, duration: number): void {
    this.notifications.update((notifications) => [
      ...notifications,
      { id: this.nextId++, variant, message, duration }
    ]);
  }
}
