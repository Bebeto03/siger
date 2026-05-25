import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  attendanceGeneral(): Promise<number | null> {
    return firstValueFrom(
      this.http.get<number>(`${this.api}/attendance/meeting/general`).pipe(
        timeout(8000),
        catchError(() => of(null))
      )
    );
  }

  averageTime(): Promise<number | null> {
    return firstValueFrom(
      this.http.get<number>(`${this.api}/average-time`).pipe(
        timeout(8000),
        catchError(() => of(null))
      )
    );
  }
}
