import { Routes } from '@angular/router';

export const ATAS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./ata-list').then(m => m.AtaList) },
];
