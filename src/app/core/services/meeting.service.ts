import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface MeetingParticipant {
  id?: number;
  name: string;
  email: string;
  role: 'ORGANIZADOR' | 'PARTICIPANTE' | 'PALESTRANTE';
  status?: 'SIM' | 'NAO' | 'TALVEZ' | null;
}

export interface MeetingTopic {
  id?: number;
  title: string;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  timer: number;
  orderIndex: number;
  concluded: boolean;
}

export interface Meeting {
  id?: number;
  title: string;
  description: string;
  location: string;
  meetingDate: string;
  duration: number;
  status?: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  user?: { id: number; name: string; email: string };
  participants: MeetingParticipant[];
  topics: MeetingTopic[];
}

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

  criar(data: Omit<Meeting, 'id'>): Promise<Meeting> {
    return firstValueFrom(this.http.post<Meeting>(this.api, data));
  }

  editar(id: number, data: Partial<Meeting>): Promise<Meeting> {
    return firstValueFrom(this.http.put<Meeting>(`${this.api}/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
