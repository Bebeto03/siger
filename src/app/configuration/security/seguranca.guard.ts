import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class SegurancaGuard implements CanActivate {

  constructor(
    private router: Router,
    private authorizationService: AuthorizationService,
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      if (this.authorizationService.isAccessTokenInvalido()) {
        this.authorizationService.limparAccessToken();
        return this.authorizationService.obterNovoAccessToken()
          .then(() => {
            if (this.authorizationService.isAccessTokenInvalido()) {
              this.authorizationService.logout();
              return false;
            }

            return true;
          });
      } else if (next.data['authorities'] && !this.authorizationService.temQualquerPermissao(next.data['authorities'])) {
        this.router.navigate(['/nao-autorizado']);
        return false;
      }

      return true;

  }

}