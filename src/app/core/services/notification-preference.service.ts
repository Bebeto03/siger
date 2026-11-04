import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SKIP_ERROR_NAVIGATION } from '../interceptors/error.interceptor';
import { NotificationPreference, NotificationPreferenceItem } from '../models/notification-preference.model';

@Injectable({ providedIn: 'root' })
export class NotificationPreferenceService {
  private readonly api = `${environment.apiUrl}/notification/preferences`;
  // O backend devolve qualquer erro (inclusive 400) como 403 por causa do /error no SecurityConfig;
  // sem isso o interceptor tiraria o usuário da tela de configurações.
  private readonly context = new HttpContext().set(SKIP_ERROR_NAVIGATION, true);

  constructor(private http: HttpClient) {}

  buscarMinhas(): Promise<NotificationPreference[]> {
    return firstValueFrom(this.http.get<NotificationPreference[]>(this.api, { context: this.context }));
  }

  /** Atualização parcial: envie apenas os tipos alterados. Retorna a lista completa. */
  salvarMinhas(preferences: NotificationPreferenceItem[]): Promise<NotificationPreference[]> {
    return firstValueFrom(this.http.put<NotificationPreference[]>(this.api, { preferences }, { context: this.context }));
  }
}
