import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from './authorization.service';

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthorizationService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.temQualquerPermissao(roles)) return true;

  return router.createUrlTree(['/acesso-negado']);
};
