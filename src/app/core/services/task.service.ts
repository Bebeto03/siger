import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Task, TaskStatus } from '../models/task.model';
import { SKIP_ERROR_NAVIGATION } from '../interceptors/error.interceptor';

export type { Task } from '../models/task.model';

export interface TaskCreateDTO {
  title: string;
  status: TaskStatus;
  meetingId: number;
  assigneeId?: number;
  dueDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly api = `${environment.apiUrl}/task`;

  constructor(private http: HttpClient) {}

  listar(): Promise<Task[]> {
    return firstValueFrom(this.http.get<Task[]>(`${this.api}/findAll`));
  }

  listarPorReuniao(meetingId: number): Promise<Task[]> {
    return this.listar().then(all => all.filter(t => t.meeting?.id === meetingId));
  }

  listarPorReuniaoPorUsuario(): Promise<Task[]> {
    return firstValueFrom(this.http.get<Task[]>(`${this.api}/meeting/me`));
  }

  buscar(id: number): Promise<Task> {
    return firstValueFrom(this.http.get<Task>(`${this.api}/${id}`));
  }

  criar(data: TaskCreateDTO): Promise<Task> {
    console.log(data)
    return firstValueFrom(
      this.http.post<Task>(`${this.api}/create`, data, {
        context: new HttpContext().set(SKIP_ERROR_NAVIGATION, true),
      })
    );
  }

  editarStatus(id: number, status: string): Promise<Task> {
    return firstValueFrom(this.http.put<Task>(`${this.api}/status/${id}`, 
      JSON.stringify(status),{headers: {'Content-Type': 'application/json'}}));
  }
  editarEntity(id: number, data: Partial<Task>): Promise<Task> {
    return firstValueFrom(this.http.put<Task>(`${this.api}/update/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
