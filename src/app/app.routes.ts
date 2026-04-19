import { Routes } from '@angular/router';
import { Dashboard } from './view/dashboard/dashboard';
import { AppLayout } from './layout/component/app.layout';

import { Login } from './components/login/login';
import { NotFound } from './components/not-found/not-found';
import { AccessDenied } from './components/access-denied/access-denied';
import { SegurancaGuard } from './configuration/security/seguranca.guard';
import { Authorized } from './configuration/security/authorized/authorized';

export const routes: Routes = [
      
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard, canActivate: [SegurancaGuard] },
            { path: 'acompanhamento-obra', loadChildren: () => import('./view/acompanhamento-obra/acompanhamento-obra.routes') },
            { path: 'cidade', loadChildren: () => import('./view/cidade/cidade.routes') },
            { path: 'obra', loadChildren: () => import('./view/obra/obra.routes') },
            { path: 'orcamento', loadChildren: () => import('./view/orcamento/orcamento.routes') },
            { path: 'regiao', loadChildren: () => import('./view/regiao/regiao.routes') },
            { path: 'servico', loadChildren: () => import('./view/servico/servico.routes') },
            { path: 'solicitacao', loadChildren: () => import('./view/solicitacao/solicitacao.routes') }
        ]
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'authorized',
        component: Authorized        
    },
    {
        path: 'accessDenied',
        component: AccessDenied,
    },
    {
        path: '**',
        redirectTo: 'notfound',
    },
    {
        path: 'notfound',
        component: NotFound,
    },
    
];