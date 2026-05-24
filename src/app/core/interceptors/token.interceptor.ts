import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.buscarToken();

  if (token && auth.isLoggedIn()) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  } else if (token && !auth.isLoggedIn()) {
    localStorage.removeItem('siger_token');
  }

  return next(req);
};
