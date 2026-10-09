import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { finalize } from 'rxjs';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<any> {
    if (this.activeRequests === 0) this.loadingService.show();
    this.activeRequests++;
    return next.handle(req).pipe(
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) this.loadingService.hide();
      })
    );
  }
}
