import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Participant, ParticipantRole } from '../models/participant.model';

export type { Participant } from '../models/participant.model';

export interface ParticipantAddDTO {
  userId: number;
  meetingId: number;
  role: ParticipantRole;
}

@Injectable({ providedIn: 'root' })
export class ParticipantService {
  private readonly api = `${environment.apiUrl}/participant`;

  constructor(private http: HttpClient) {}

  private map(p: any): Participant {
    return {
      id:            p.id,
      role:          p.role,
      participation: p.participation,
      user: {
        id:    p.userId    ?? p.user?.id,
        name:  p.userName  ?? p.user?.name,
        email: p.userEmail ?? p.user?.email,
      },
      meeting: { id: p.meetingId ?? p.meeting?.id },
    };
  }

  listar(): Promise<Participant[]> {
    return firstValueFrom(this.http.get<any[]>(`${this.api}/findAll`))
      .then(list => list.map(p => this.map(p)));
  }

  listarPorReuniao(meetingId: number): Promise<Participant[]> {
    return firstValueFrom(this.http.get<any[]>(`${this.api}/meeting/${meetingId}`))
      .then(list => list.map(p => this.map(p)));
  }

  buscar(id: number): Promise<Participant> {
    return firstValueFrom(this.http.get<any>(`${this.api}/${id}`))
      .then(p => this.map(p));
  }

  criar(data: ParticipantAddDTO): Promise<Participant> {
    return firstValueFrom(this.http.post<any>(`${this.api}/add`, data))
      .then(p => this.map(p));
  }

  editar(id: number, data: Partial<Participant>): Promise<Participant> {
    return firstValueFrom(this.http.put<any>(`${this.api}/${id}`, data))
      .then(p => this.map(p));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
