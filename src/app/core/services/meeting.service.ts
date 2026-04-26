import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Meeting } from '../models/meeting.model';

export type { Meeting } from '../models/meeting.model';

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private readonly api = `${environment.apiUrl}/api/meeting`;

  constructor(private http: HttpClient) {}

  listar(): Promise<Meeting[]> {
    return firstValueFrom(this.http.get<Meeting[]>(`${this.api}/findAll`));
  }

  buscar(id: number): Promise<Meeting> {
    return firstValueFrom(this.http.get<Meeting>(`${this.api}/${id}`));
  }

  criar(data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    return firstValueFrom(this.http.post<Meeting>(this.api, data));
  }

  editar(id: number, data: Partial<Meeting>): Promise<Meeting> {
    return firstValueFrom(this.http.put<Meeting>(`${this.api}/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
