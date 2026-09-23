import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import { API_ROUTES } from '../../constants/api-routes';
import { ApiService } from '../../http/api.service';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly currentUser$ = new BehaviorSubject<AuthUser | null>(null);

  constructor(private api: ApiService) {}

  login(email: string, password: string): Observable<AuthUser> {
    return this.api.post<unknown>(API_ROUTES.auth.login, { email, password }).pipe(
      tap((response) => this.storeToken(this.extractToken(response))),
      switchMap(() => this.loadProfile())
    );
  }

  loadProfile(): Observable<AuthUser> {
    return this.api.get<unknown>(API_ROUTES.auth.me).pipe(
      map((response) => this.extractUser(response)),
      tap((user) => {
        this.currentUser$.next(user);
        localStorage.setItem('auth_user', JSON.stringify(user));
      })
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    if (!this.getToken()) {
      return of(null);
    }

    if (this.currentUser$.value) {
      return of(this.currentUser$.value);
    }

    return this.loadProfile().pipe(
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  logout(): Observable<boolean> {
    return of(true).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.currentUser$.value);
  }

  isAdmin(): boolean {
    const role = this.currentUser$.value?.role.toLowerCase();
    return role === 'admin' || role === 'super_admin';
  }

  hasDashboardAccess(): boolean {
    return ['super_admin', 'admin', 'editor', 'communication'].includes(this.currentUser$.value?.role.toLowerCase() ?? '');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
  }

  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('access_token');
    this.currentUser$.next(null);
  }

  private storeToken(token: string | undefined): void {
    if (!token) {
      throw new Error('No token returned by the backend.');
    }
    localStorage.setItem('access_token', token);
  }

  private extractToken(response: unknown): string | undefined {
    const root = this.asRecord(response);
    const data = this.asRecord(root?.['data']);
    return this.asString(root?.['access_token'])
      ?? this.asString(root?.['accessToken'])
      ?? this.asString(root?.['token'])
      ?? this.asString(data?.['access_token'])
      ?? this.asString(data?.['accessToken'])
      ?? this.asString(data?.['token']);
  }

  private extractUser(response: unknown): AuthUser {
    const root = this.asRecord(response) ?? {};
    const data = this.asRecord(root['data']) ?? root;
    const user = this.asRecord(data['user']) ?? data;
    const id = this.asString(user['id']) ?? this.asString(user['_id']);
    const email = this.asString(user['email']);
    const role = this.asString(user['role']);
    const name = this.asString(user['name'])
      ?? [this.asString(user['firstName']), this.asString(user['lastName'])].filter(Boolean).join(' ');

    if (!id || !email || !role || !name) {
      throw new Error('Incomplete user profile returned by the backend.');
    }

    return {
      id,
      email,
      name,
      role,
      avatar: this.asString(user['avatar']),
      location: this.asString(user['location'])
    };
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
