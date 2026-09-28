import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { BACKGROUND_REQUEST } from './request-context';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(BACKGROUND_REQUEST)) return next(req);

  const loading = inject(LoadingService);
  loading.show();
  return next(req).pipe(finalize(() => loading.hide()));
};
