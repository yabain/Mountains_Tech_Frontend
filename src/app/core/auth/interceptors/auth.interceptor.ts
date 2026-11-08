import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly platformId = inject(PLATFORM_ID);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<any> {
    const token = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')
      : null;

    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next.handle(cloned);
    }

    return next.handle(req);
  }
}
