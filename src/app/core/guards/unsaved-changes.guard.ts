import { CanDeactivateFn } from '@angular/router';

export interface CanDeactivate {
  podeMudarDeRota(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivate> = (component) => {
  if (!component.podeMudarDeRota || component.podeMudarDeRota()) return true;
  return confirm('Há alterações não salvas. Deseja sair sem salvar?');
};
