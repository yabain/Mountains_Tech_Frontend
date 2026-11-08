import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly platformId = inject(PLATFORM_ID);

  constructor(private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<any> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const isLoginRequest = req.url.includes('/auth/login');

        if (isPlatformBrowser(this.platformId) && error.status === 401 && !isLoginRequest) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('auth_user');
          sessionStorage.removeItem('access_token');
          void this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}
