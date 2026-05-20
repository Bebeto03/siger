import { Routes } from '@angular/router';

export const TAREFAS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./tarefa-list/tarefa-list').then(m => m.TarefaList) },
];
