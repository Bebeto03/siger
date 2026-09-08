import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AvailabilityBlock } from '../models/availability.model';

@Injectable({ providedIn: 'root' })
export class UserAvailabilityService {
  private readonly api = `${environment.apiUrl}/availability`;
  constructor(private http: HttpClient) {}

  buscarMinha(): Promise<AvailabilityBlock[]> {
    return firstValueFrom(this.http.get<AvailabilityBlock[]>(`${this.api}/me`));
  }

  salvarMinha(blocks: AvailabilityBlock[]): Promise<AvailabilityBlock[]> {
    return firstValueFrom(this.http.put<AvailabilityBlock[]>(`${this.api}/me`, { blocks }));
  }
}
