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
  private readonly api = `${environment.apiUrl}/api/log`;

  constructor(private http: HttpClient) {}

  registrar(operation: string, userName: string): Promise<void> {
    const entry: LogEntry = {
      operation,
      userName,
      date: new Date().toISOString(),
    };
    return firstValueFrom(this.http.post<void>(this.api, entry));
  }
}
