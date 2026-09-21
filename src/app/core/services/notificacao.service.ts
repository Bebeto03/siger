import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { BACKGROUND_REQUEST } from '../interceptors/request-context';
import { ContagemNaoLidas, Notificacao } from '../models/notificacao.model';

/** Notificações persistidas da plataforma (sino do topbar). Não confundir com NotificationService (toasts). */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  static readonly INTERVALO_POLLING_MS = 60_000;

  private readonly api = `${environment.apiUrl}/notification`;
  private readonly segundoPlano = new HttpContext().set(BACKGROUND_REQUEST, true);

  private readonly _lista = signal<Notificacao[]>([]);
  private readonly _naoLidas = signal(0);

  readonly lista = this._lista.asReadonly();
  readonly naoLidas = this._naoLidas.asReadonly();

  constructor(private http: HttpClient) {}

  /** Busca lista e contagem. Falhas são silenciosas: o próximo ciclo tenta de novo. */
  async atualizar(): Promise<void> {
    try {
      const [lista, contagem] = await Promise.all([
        firstValueFrom(this.http.get<Notificacao[]>(this.api, { context: this.segundoPlano })),
        firstValueFrom(this.http.get<ContagemNaoLidas>(`${this.api}/unread-count`, { context: this.segundoPlano })),
      ]);
      this._lista.set(lista);
      this._naoLidas.set(contagem.count);
    } catch {
      /* mantém o último estado conhecido */
    }
  }

  async marcarComoLida(notificacao: Notificacao): Promise<void> {
    if (notificacao.read) return;

    this._lista.update(lista => lista.map(n => (n.id === notificacao.id ? { ...n, read: true } : n)));
    this._naoLidas.update(total => Math.max(0, total - 1));

    try {
      await firstValueFrom(
        this.http.patch<Notificacao>(`${this.api}/${notificacao.id}/read`, null, { context: this.segundoPlano })
      );
    } catch {
      await this.atualizar(); // desfaz a atualização otimista se o servidor recusou
    }
  }

  async marcarTodasComoLidas(): Promise<void> {
    if (this._naoLidas() === 0) return;

    this._lista.update(lista => lista.map(n => ({ ...n, read: true })));
    this._naoLidas.set(0);

    try {
      await firstValueFrom(this.http.patch<void>(`${this.api}/read-all`, null, { context: this.segundoPlano }));
    } catch {
      await this.atualizar();
    }
  }

  /**
   * Atualiza agora e a cada 60s enquanto a aba estiver visível; ao voltar para a aba, atualiza na hora.
   * @returns função que interrompe o polling
   */
  iniciarPolling(): () => void {
    void this.atualizar();

    const timer = setInterval(() => {
      if (!document.hidden) void this.atualizar();
    }, NotificacaoService.INTERVALO_POLLING_MS);

    const aoVoltarParaAba = () => {
      if (!document.hidden) void this.atualizar();
    };
    document.addEventListener('visibilitychange', aoVoltarParaAba);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', aoVoltarParaAba);
    };
  }
}
