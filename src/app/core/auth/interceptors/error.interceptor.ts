import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Observable } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationService: NotificationService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<any> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const isLoginRequest = req.url.includes('/auth/login');

        if (error.status === 401 && !isLoginRequest) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('auth_user');
          sessionStorage.removeItem('access_token');
          void this.router.navigate(['/login']);
        }

        if (!isLoginRequest) {
          const message = error.status === 403
            ? 'Vous n\'avez pas les droits necessaires.'
            : error.status === 404
              ? 'La ressource demandee est introuvable.'
              : error.error?.message ?? 'Une erreur est survenue.';
          this.notificationService.error(message);
        }

        return throwError(() => error);
      })
    );
  }
}
