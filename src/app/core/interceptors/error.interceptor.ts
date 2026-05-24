import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 401:
          localStorage.clear();
          router.navigate(['/login']);
          break;
        case 403:
          router.navigate(['/acesso-negado']);
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
