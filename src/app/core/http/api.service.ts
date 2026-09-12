import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(url: string, params?: Record<string, unknown>): Observable<T> {
    const httpParams = params ? new HttpParams({ fromObject: params as any }) : undefined;
    return this.http.get<T>(this.apiUrl(url), { params: httpParams });
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.apiUrl(url), body);
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.apiUrl(url), body);
  }

  patch<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.apiUrl(url), body);
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.apiUrl(url));
  }

  private apiUrl(url: string): string {
    if (/^https?:\/\//.test(url)) {
      return url;
    }

    return `${environment.apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }
}
