import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Task } from '../models/task.model';

export type { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly api = `${environment.apiUrl}/task`;

  constructor(private http: HttpClient) {}

  listar(): Promise<Task[]> {
    return firstValueFrom(this.http.get<Task[]>(`${this.api}/findAll`));
  }

  listarPorReuniao(meetingId: number): Promise<Task[]> {
    return this.listar().then(all => all.filter(t => t.meeting.id === meetingId));
  }

  buscar(id: number): Promise<Task> {
    return firstValueFrom(this.http.get<Task>(`${this.api}/${id}`));
  }

  criar(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    return firstValueFrom(this.http.post<Task>(this.api, data));
  }

  editar(id: number, data: Partial<Task>): Promise<Task> {
    return firstValueFrom(this.http.put<Task>(`${this.api}/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
