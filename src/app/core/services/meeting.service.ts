import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Meeting } from '../models/meeting.model';

export type { Meeting } from '../models/meeting.model';

export interface MeetingCreateDTO {
  userId: number;
  meetingDate: string;
  title: string;
  description: string;
  location: string;
  duration: number;
}

export interface MeetingUpdateDTO {
  meetingDate: string;
  title: string;
  description: string;
  location: string;
  duration: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private readonly api = `${environment.apiUrl}/meeting`;

  constructor(private http: HttpClient) {}

  listar(): Promise<Meeting[]> {
    return firstValueFrom(this.http.get<Meeting[]>(`${this.api}/findAll`));
  }

  buscar(id: number): Promise<Meeting> {
    return firstValueFrom(this.http.get<Meeting>(`${this.api}/${id}`));
  }

  criar(data: MeetingCreateDTO): Promise<Meeting> {
    return firstValueFrom(this.http.post<Meeting>(`${this.api}/create`, data));
  }

  editar(id: number, data: MeetingUpdateDTO): Promise<Meeting> {
    return firstValueFrom(this.http.put<Meeting>(`${this.api}/update/${id}`, data));
  }

  cancelar(id: number): Promise<Meeting> {
    return firstValueFrom(this.http.patch<Meeting>(`${this.api}/cancel/${id}`, {}));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
