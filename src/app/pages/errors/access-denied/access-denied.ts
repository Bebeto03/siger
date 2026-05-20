import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6" style="background: var(--color-bg);">
      <div class="text-center max-w-md">
        <div class="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl"
             style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);">🔒</div>
        <h1 class="text-3xl font-black mb-3" style="color: var(--color-text-primary);">Acesso Negado</h1>
        <p class="text-sm mb-8" style="color: var(--color-text-muted);">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador.
        </p>
        <a routerLink="/dashboard"
           class="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold"
           style="background: var(--color-primary); color: #000;">
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  `
})
export class AccessDenied {}
