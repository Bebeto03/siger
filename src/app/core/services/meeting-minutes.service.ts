import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { MeetingMinutes } from '../models/meeting-minutes.model';
import { SKIP_ERROR_NAVIGATION } from '../interceptors/error.interceptor';

export type { MeetingMinutes } from '../models/meeting-minutes.model';

export interface MeetingMinutesDTO {
  meetingId: number;
  objectives: string;
  notes: string;
  decision: string;
}

@Injectable({ providedIn: 'root' })
export class MeetingMinutesService {
  private readonly api = `${environment.apiUrl}/meeting/minutes`;

  constructor(private http: HttpClient) {}

  listar(): Promise<MeetingMinutes[]> {
    return firstValueFrom(this.http.get<MeetingMinutes[]>(`${this.api}/findAll`));
  }

  buscarPorReuniao(meetingId: number): Promise<MeetingMinutes | null> {
    return firstValueFrom(
      this.http.get<MeetingMinutes>(`${this.api}/findCurrent/${meetingId}`, {
        context: new HttpContext().set(SKIP_ERROR_NAVIGATION, true),
      })
    ).catch(() => null);
  }

  buscar(id: number): Promise<MeetingMinutes> {
    return firstValueFrom(this.http.get<MeetingMinutes>(`${this.api}/${id}`));
  }

  criar(data: MeetingMinutesDTO, opts?: { skipNavigation?: boolean }): Promise<MeetingMinutes> {
    const context = opts?.skipNavigation
      ? new HttpContext().set(SKIP_ERROR_NAVIGATION, true)
      : undefined;
    return firstValueFrom(this.http.post<MeetingMinutes>(this.api, data, { context }));
  }

  editar(id: number, data: Partial<MeetingMinutesDTO>): Promise<MeetingMinutes> {
    return firstValueFrom(this.http.put<MeetingMinutes>(`${this.api}/${id}`, data));
  }

  excluir(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
