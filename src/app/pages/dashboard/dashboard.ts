import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="p-7">
      <h1 class="text-2xl font-bold mb-1" style="color: var(--color-text-primary);">Dashboard</h1>
      <p style="color: var(--color-text-muted);">Em desenvolvimento — Fase 4.</p>
    </div>
  `
})
export class Dashboard {}
