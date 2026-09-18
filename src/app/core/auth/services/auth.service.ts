import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';

import { API_ROUTES } from '../../constants/api-routes';
import { ApiService } from '../../http/api.service';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthResponse {
  access_token?: string;
  token?: string;
  user?: AuthUser;
  data?: AuthUser;
  id?: string;
  email?: string;
  name?: string;
  role?: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly currentUser$ = new BehaviorSubject<AuthUser | null>(null);

  constructor(private api: ApiService) {}

  login(email: string, password: string): Observable<AuthUser> {
    return this.api.post<AuthResponse>(API_ROUTES.auth.login, { email, password }).pipe(
      map((response) => {
        const token = response.access_token ?? response.token;
        const user = response.user ?? response.data ?? response;

        if (token) {
          localStorage.setItem('access_token', token);
        }

        const authenticatedUser = user as AuthUser;
        this.currentUser$.next(authenticatedUser);
        return authenticatedUser;
      })
    );
  }

  logout(): Observable<boolean> {
    return of(true).pipe(
      tap(() => {
        localStorage.removeItem('access_token');
        this.currentUser$.next(null);
      })
    );
  }

  isAuthenticated(): boolean {
    return this.currentUser$.value !== null;
  }

  isAdmin(): boolean {
    return this.currentUser$.value?.role === 'admin';
  }
}
