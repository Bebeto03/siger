import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface LogEntry {
  operation: string;
  userName: string;
  date?: string;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly api = `${environment.apiUrl}/log`;

  constructor(private http: HttpClient) {}

  registrar(operation: string, _userName?: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(this.api, { operation }));
  }
}
