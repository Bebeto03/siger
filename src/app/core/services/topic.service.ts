import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Topic, TopicPriority } from '../models/topic.model';

export type { Topic } from '../models/topic.model';

export interface TopicDTO {
  meetingMinutes: { id: number };
  participant?: { id: number };
  title: string;
  timer?: number;
  orderIndex: number;
  concluded: boolean;
  priority: TopicPriority;
}

@Injectable({ providedIn: 'root' })
export class TopicService {
  private readonly api = `${environment.apiUrl}/topic`;

  constructor(private http: HttpClient) {}

  listar(): Promise<Topic[]> {
    return firstValueFrom(this.http.get<Topic[]>(`${this.api}/findAll`));
  }

  listarPorAta(minutesId: number): Promise<Topic[]> {
    return this.listar().then(all => all.filter(t => (t as any).meetingMinutesId === minutesId || (t as any).meetingMinutes?.id === minutesId));
  }

  buscar(id: number): Promise<Topic> {
    return firstValueFrom(this.http.get<Topic>(`${this.api}/${id}`));
  }

  criar(data: TopicDTO): Promise<Topic> {
    return firstValueFrom(this.http.post<Topic>(this.api, data));
  }

  editar(id: number, data: Partial<TopicDTO>): Promise<Topic> {
    return firstValueFrom(this.http.put<Topic>(`${this.api}/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
