import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const REUNIOES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./reuniao-list/reuniao-list').then(m => m.ReuniaoList) },
  { path: 'nova', loadComponent: () => import('./reuniao-form/reuniao-form').then(m => m.ReuniaoForm), canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_ORGANIZADOR'])] },
  { path: ':id', loadComponent: () => import('./reuniao-detalhe/reuniao-detalhe').then(m => m.ReuniaoDetalhe) },
  { path: ':id/editar', loadComponent: () => import('./reuniao-form/reuniao-form').then(m => m.ReuniaoForm), canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_ORGANIZADOR'])] },
];
