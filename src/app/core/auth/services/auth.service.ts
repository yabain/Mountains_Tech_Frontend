import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly currentUser$ = new BehaviorSubject<AuthUser | null>(null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>('/api/auth/login', { email, password }).pipe(
      tap((user) => this.currentUser$.next(user))
    );
  }

  logout(): Observable<boolean> {
    return of(true).pipe(tap(() => this.currentUser$.next(null)));
  }

  isAuthenticated(): boolean {
    return this.currentUser$.value !== null;
  }

  isAdmin(): boolean {
    return this.currentUser$.value?.role === 'admin';
  }
}
