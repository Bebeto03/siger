import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { MeetingMinutes } from '../models/meeting-minutes.model';

export type { MeetingMinutes } from '../models/meeting-minutes.model';

@Injectable({ providedIn: 'root' })
export class MeetingMinutesService {
  private readonly api = `${environment.apiUrl}/meeting/minutes`;

  constructor(private http: HttpClient) {}

  listar(): Promise<MeetingMinutes[]> {
    return firstValueFrom(this.http.get<MeetingMinutes[]>(`${this.api}/findAll`));
  }

  buscarPorReuniao(meetingId: number): Promise<MeetingMinutes | null> {
    return firstValueFrom(
      this.http.get<MeetingMinutes>(`${this.api}/findCurrent/${meetingId}`)
    ).catch(() => null);
  }

  buscar(id: number): Promise<MeetingMinutes> {
    return firstValueFrom(this.http.get<MeetingMinutes>(`${this.api}/${id}`));
  }

  criar(data: Omit<MeetingMinutes, 'id' | 'topics'>): Promise<MeetingMinutes> {
    return firstValueFrom(this.http.post<MeetingMinutes>(this.api, data));
  }

  editar(id: number, data: Partial<MeetingMinutes>): Promise<MeetingMinutes> {
    return firstValueFrom(this.http.put<MeetingMinutes>(`${this.api}/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
