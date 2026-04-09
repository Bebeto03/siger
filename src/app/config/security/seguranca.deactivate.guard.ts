import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";


export interface ICanDeactivate {
  podeMudarDeRota(): any;
}


@Injectable()
export class SegurancaDeactivateGuard implements CanDeactivate<ICanDeactivate> {

  canDeactivate(
    component: ICanDeactivate,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Observable<boolean>|Promise<boolean>|boolean {
    return component.podeMudarDeRota ? component.podeMudarDeRota() : true;
  }
}
