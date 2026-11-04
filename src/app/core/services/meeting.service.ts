import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Meeting } from '../models/meeting.model';
import { TimeRange, DayOfWeek } from '../models/availability.model';


export type { Meeting } from '../models/meeting.model';

export interface MeetingCreateDTO {
  user: { id: number };
  estimatedMeetingDate: string;
  title: string;
  description: string;
  location: string;
  isPresent?: boolean;
  duration: number;
}

export interface MeetingUpdateDTO {
  estimatedMeetingDate: string;
  title: string;
  description: string;
  location: string;
  isPresent?: boolean;
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

  listarMinhasReunioes(): Promise<Meeting[]> {
    return firstValueFrom(this.http.get<Meeting[]>(`${this.api}/my`));
  }

  buscar(id: number): Promise<Meeting> {
    return firstValueFrom(this.http.get<Meeting>(`${this.api}/${id}`));
  }

  criar(data: MeetingCreateDTO): Promise<Meeting> {
    return firstValueFrom(this.http.post<Meeting>(`${this.api}`, data));
  }

  editar(id: number, data: MeetingUpdateDTO): Promise<Meeting> {
    return firstValueFrom(this.http.put<Meeting>(`${this.api}/${id}`, data));
  }

  cancelar(id: number): Promise<Meeting> {
    return firstValueFrom(this.http.patch<Meeting>(`${this.api}/cancel/${id}`, {}));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }

  iniciar(id: number): Promise<Meeting> {
    return firstValueFrom(this.http.post<Meeting>(`${this.api}/start/${id}`, {}));
  }
  
  finalizar(id: number): Promise<Meeting> {
    return firstValueFrom(this.http.post<Meeting>(`${this.api}/finalize/${id}`, {}));
  }

  findCommonAvailability(userIds: number[],dayOfWeek: DayOfWeek): Promise<TimeRange[]> {
    let params = new HttpParams().set('dayOfWeek', dayOfWeek);

    userIds.forEach(userId => {
      params = params.append('userIds', userId);
    });

    return firstValueFrom(this.http.get<TimeRange[]>(`${this.api}/common-availability`, { params }));
  }

  findBestAvailability(availableTimes: TimeRange[]): Promise<TimeRange | null> {
    return firstValueFrom(this.http.post<TimeRange | null>(`${this.api}/best-time`, availableTimes));
  }
}
