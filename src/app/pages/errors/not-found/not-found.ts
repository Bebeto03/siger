import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6" style="background: var(--color-bg);">
      <div class="text-center max-w-md">
        <div class="text-7xl font-black mb-4" style="color: var(--color-primary);">404</div>
        <h1 class="text-2xl font-bold mb-3" style="color: var(--color-text-primary);">Página não encontrada</h1>
        <p class="text-sm mb-8" style="color: var(--color-text-muted);">
          Verifique o endereço na URL ou volte para o início.
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
export class NotFound {}
