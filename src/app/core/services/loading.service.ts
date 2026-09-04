import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  readonly isLoading$ = new BehaviorSubject(false);

  show(): void {
    this.isLoading$.next(true);
  }

  hide(): void {
    this.isLoading$.next(false);
  }

  toggle(value: boolean): void {
    this.isLoading$.next(value);
  }
}
