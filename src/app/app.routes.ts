import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then(m => m.Login),
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPassword),
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./pages/auth/reset-password/reset-password').then(m => m.ResetPassword),
  },
  {
    path: 'acesso-negado',
    loadComponent: () => import('./pages/errors/access-denied/access-denied').then(m => m.AccessDenied),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.AppLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'reunioes',
        loadChildren: () => import('./pages/reunioes/reunioes.routes').then(m => m.REUNIOES_ROUTES),
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./pages/usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES),
        canActivate: [roleGuard(['ADMIN'])],
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./pages/configuracoes/configuracoes').then(m => m.Configuracoes),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/errors/not-found/not-found').then(m => m.NotFound),
  },
];
