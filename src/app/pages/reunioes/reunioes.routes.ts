import { Routes } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `<div class="p-7"><h1 style="color: var(--color-text-primary);" class="text-2xl font-bold">Reuniões</h1><p style="color: var(--color-text-muted);">Em desenvolvimento — Fase 2.</p></div>`
})
class ReunioesList {}

export const REUNIOES_ROUTES: Routes = [
  { path: '', component: ReunioesList },
];
