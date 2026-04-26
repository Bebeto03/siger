import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Participant } from '../models/participant.model';

export type { Participant } from '../models/participant.model';

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private readonly api = `${environment.apiUrl}/api/participant`;

  constructor(private http: HttpClient) {}

  listar(): Promise<Participant[]> {
    return firstValueFrom(this.http.get<Participant[]>(`${this.api}/findAll`));
  }

  listarPorReuniao(meetingId: number): Promise<Participant[]> {
    return this.listar().then(all => all.filter(p => p.meeting.id === meetingId));
  }

  buscar(id: number): Promise<Participant> {
    return firstValueFrom(this.http.get<Participant>(`${this.api}/${id}`));
  }

  criar(data: Omit<Participant, 'id'>): Promise<Participant> {
    return firstValueFrom(this.http.post<Participant>(this.api, data));
  }

  editar(id: number, data: Partial<Participant>): Promise<Participant> {
    return firstValueFrom(this.http.put<Participant>(`${this.api}/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
