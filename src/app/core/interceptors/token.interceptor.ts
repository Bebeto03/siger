import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, switchMap, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Não interceptar as próprias chamadas de autenticação para evitar loops
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = auth.buscarToken();
  const refreshToken = auth.buscarRefreshToken();

  // Access token válido: adiciona o header e segue normalmente
  if (token && auth.isLoggedIn()) {
    return next(adicionarBearer(req, token));
  }

  // Access token expirado mas há refresh token: renova antes de enviar
  if (refreshToken) {
    return auth.refreshAccessToken().pipe(
      switchMap(tokens => next(adicionarBearer(req, tokens.accessToken))),
      catchError(() => {
        auth.logout();
        return EMPTY;
      })
    );
  }

  // Sem tokens: envia sem header (será tratado pelo servidor como não autenticado)
  return next(req);
};

function adicionarBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
