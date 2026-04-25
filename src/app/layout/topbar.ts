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

  pageTitle(): string {
    const map: Record<string, string> = {
      '/dashboard':     'Dashboard',
      '/reunioes':      'Reuniões',
      '/usuarios':      'Usuários',
      '/configuracoes': 'Configurações',
    };
    const url = this.router.url.split('?')[0];
    for (const [key, val] of Object.entries(map)) {
      if (url.startsWith(key)) return val;
    }
    return 'SIGER';
  }
}
