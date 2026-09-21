import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { BACKGROUND_REQUEST } from './request-context';

export const SKIP_ERROR_NAVIGATION = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notify = inject(NotificationService);
  const auth = inject(AuthService);
  const skipNavigation = req.context.get(SKIP_ERROR_NAVIGATION);
  const background = req.context.get(BACKGROUND_REQUEST);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Segundo plano: só a sessão expirada tem efeito; demais falhas ficam silenciosas.
      if (background && err.status !== 401) return throwError(() => err);

      switch (err.status) {
        case 401:
          // Não acionar logout recursivo se o próprio /auth/refresh falhou
          if (!req.url.includes('/auth/refresh')) {
            auth.logout();
          }
          break;
        case 403:
          if (!skipNavigation) router.navigate(['/acesso-negado']);
          break;
        case 400:
          notify.warning(err.error?.message ?? 'Dados inválidos. Verifique as informações.');
          break;
        case 404:
          notify.warning('Recurso não encontrado.');
          break;
        case 0:
          notify.error('Sem conexão com o servidor.');
          break;
        default:
          notify.error('Erro interno do servidor. Tente novamente.');
      }
      return throwError(() => err);
    })
  );
};
