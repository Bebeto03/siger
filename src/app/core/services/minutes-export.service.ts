import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class MinutesExportService {

  private readonly api = `${environment.apiUrl}/pdf`;

  constructor(private http: HttpClient) {}

  exportMinutes(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/meeting/${id}`,{responseType: 'blob'});
  }

}
