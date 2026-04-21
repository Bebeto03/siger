import { Routes } from '@angular/router';
import { authGuard } from './configuration/security/auth.guard';
import { roleGuard } from './configuration/security/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login),
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPassword),
  },
  {
    path: 'redefinir-senha',
    loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPassword),
  },
  {
    path: 'acesso-negado',
    loadComponent: () => import('./components/access-denied/access-denied').then(m => m.AccessDenied),
  },
  {
    path: '',
    loadComponent: () => import('./layout/component/app.layout').then(m => m.AppLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./view/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'reunioes',
        loadChildren: () => import('./view/reunioes/reunioes.routes').then(m => m.REUNIOES_ROUTES),
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./view/usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES),
        canActivate: [roleGuard(['ADMIN'])],
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./view/configuracoes/configuracoes').then(m => m.Configuracoes),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found').then(m => m.NotFound),
  },
];
