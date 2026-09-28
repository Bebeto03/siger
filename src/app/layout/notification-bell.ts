import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Notificacao } from '../core/models/notificacao.model';
import { NotificacaoService } from '../core/services/notificacao.service';

/** "há 5 min", "há 3 h", "há 2 d" a partir de um LocalDateTime ISO do backend. */
export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const minutos = Math.floor((agora.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return `há ${Math.floor(horas / 24)} d`;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="alternar()"
        class="relative flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
        style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-secondary);"
        aria-label="Notificações"
        aria-haspopup="true"
        [attr.aria-expanded]="aberto()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (notificacoes.naoLidas() > 0) {
          <span class="absolute flex items-center justify-center text-[10px] font-bold rounded-full"
                style="top: -6px; right: -6px; min-width: 18px; height: 18px; padding: 0 4px; background: var(--color-danger); color: #fff;"
                [attr.aria-label]="notificacoes.naoLidas() + ' não lidas'">
            {{ notificacoes.naoLidas() > 99 ? '99+' : notificacoes.naoLidas() }}
          </span>
        }
      </button>

      @if (aberto()) {
        <div class="absolute right-0 mt-2 rounded-xl overflow-hidden z-50"
             style="width: 360px; max-width: calc(100vw - 32px); background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 10px 30px rgba(0,0,0,0.4);"
             role="dialog" aria-label="Lista de notificações">
          <div class="flex items-center justify-between px-4 py-3" style="border-bottom: 1px solid var(--color-border);">
            <span class="text-sm font-semibold" style="color: var(--color-text-primary);">Notificações</span>
            @if (notificacoes.naoLidas() > 0) {
              <button type="button" (click)="notificacoes.marcarTodasComoLidas()"
                      class="text-xs font-semibold cursor-pointer border-none bg-transparent hover:opacity-80"
                      style="color: var(--color-primary);">
                Marcar todas como lidas
              </button>
            }
          </div>

          <div class="overflow-auto" style="max-height: 400px;">
            @for (n of notificacoes.lista(); track n.id) {
              <button type="button" (click)="abrir(n)"
                      class="w-full text-left px-4 py-3 cursor-pointer border-none flex gap-3 transition-colors hover:brightness-125"
                      [style]="n.read
                        ? 'background: transparent; border-bottom: 1px solid var(--color-border);'
                        : 'background: var(--color-primary-glow); border-bottom: 1px solid var(--color-border);'">
                <span class="mt-1.5 shrink-0 rounded-full"
                      style="width: 8px; height: 8px;"
                      [style.background]="n.read ? 'transparent' : 'var(--color-primary)'"></span>
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-semibold" style="color: var(--color-text-primary);">{{ n.title }}</span>
                  <span class="block text-xs mt-0.5" style="color: var(--color-text-secondary);">{{ n.message }}</span>
                  <span class="block text-[11px] mt-1" style="color: var(--color-text-muted);">{{ tempo(n.createdAt) }}</span>
                </span>
              </button>
            } @empty {
              <p class="px-4 py-8 text-center text-sm" style="color: var(--color-text-muted);">
                Você não tem notificações.
              </p>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationBell {
  readonly notificacoes = inject(NotificacaoService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  readonly aberto = signal(false);

  constructor() {
    const pararPolling = this.notificacoes.iniciarPolling();
    inject(DestroyRef).onDestroy(pararPolling);
  }

  alternar(): void {
    this.aberto.update(v => !v);
    if (this.aberto()) void this.notificacoes.atualizar();
  }

  async abrir(notificacao: Notificacao): Promise<void> {
    this.aberto.set(false);
    void this.notificacoes.marcarComoLida(notificacao);
    if (notificacao.meetingId != null) {
      await this.router.navigate(['/reunioes', notificacao.meetingId]);
    }
  }

  tempo(iso: string): string {
    return tempoRelativo(iso);
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: MouseEvent): void {
    if (this.aberto() && !this.host.nativeElement.contains(evento.target as Node)) {
      this.aberto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  aoPressionarEsc(): void {
    this.aberto.set(false);
  }
}
