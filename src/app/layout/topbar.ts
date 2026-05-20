import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header class="flex items-center justify-between px-7 py-4 shrink-0"
            style="background: var(--color-surface); border-bottom: 1px solid var(--color-border);">
      <div>
        <h1 class="text-xl font-bold tracking-tight" style="color: var(--color-text-primary);">{{ pageTitle() }}</h1>
        @if (pageSubtitle()) {
          <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">{{ pageSubtitle() }}</p>
        }
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm" style="color: var(--color-text-muted);">{{ auth.getNomeUsuario() }}</span>
        <button
          (click)="logout()"
          class="px-4 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-opacity hover:opacity-80"
          style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border);">
          Sair
        </button>
      </div>
    </header>
  `
})
export class AppTopbar {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  logout(): void { this.auth.logout(); }

  private get url(): string { return this.router.url.split('?')[0]; }

  pageTitle(): string {
    const map: Record<string, string> = {
      '/dashboard':     'Dashboard',
      '/reunioes':      'Reuniões',
      '/usuarios':      'Usuários',
      '/configuracoes': 'Configurações',
    };
    for (const [key, val] of Object.entries(map)) {
      if (this.url.startsWith(key)) return val;
    }
    return 'SIGER';
  }

  pageSubtitle(): string {
    const map: Record<string, string> = {
      '/dashboard':     'Visão geral do sistema',
      '/reunioes':      'Gerencie suas reuniões',
      '/usuarios':      'Gerencie os usuários do sistema',
      '/configuracoes': 'Preferências da sua conta',
    };
    for (const [key, val] of Object.entries(map)) {
      if (this.url.startsWith(key)) return val;
    }
    return '';
  }
}
