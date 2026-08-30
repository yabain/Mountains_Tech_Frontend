import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  success(message: string): void {
    console.log('Success:', message);
  }

  error(message: string): void {
    console.error('Error:', message);
  }

  info(message: string): void {
    console.info('Info:', message);
  }
}
