import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class MetricsExportService {

  private readonly api = `${environment.apiUrl}/pdf`;

  constructor(private http: HttpClient) {}

  exportMetrics(metrics: any): Observable<Blob> {
    return this.http.post(`${this.api}/metrics`,metrics,{responseType: 'blob'});
  }

  exportMetricsGraphics(metrics: any): Observable<Blob> {
    return this.http.post(`${this.api}/metrics/graphics`,metrics,{responseType: 'blob'});
  }
}
