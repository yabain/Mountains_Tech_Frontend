import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SiteData } from '../models/site.model';

@Injectable({
  providedIn: 'root'
})
export class SiteDataService {
  private readonly siteDataUrl = '/assets/data/site.json';

  constructor(private http: HttpClient) {}

  getSiteData(): Observable<SiteData> {
    return this.http.get<SiteData>(this.siteDataUrl);
  }
}
