import { Routes } from '@angular/router';

export const RELATORIOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./relatorio-list').then(m => m.RelatorioList) },
];
