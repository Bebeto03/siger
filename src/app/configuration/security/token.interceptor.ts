import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthorizationService } from './authorization.service';

export class NotAuthenticatedError {}

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {

  let intReq = request;
  let authorizationService = inject(AuthorizationService);

  const token = authorizationService.buscarToken();
  if(token != null ) {
    intReq = request.clone({headers: request.headers.set('Authorization', 'Bearer ' + token)});
  }
  return next(intReq);

}