import { CanDeactivateFn } from '@angular/router';
import { ReuniaoSalaRemota } from '../../pages/reunioes/reuniao-sala-remota/reuniao-sala-remota';

export const meetingCanDeactivateGuard: CanDeactivateFn<ReuniaoSalaRemota> =
    (component) => component.canDeactivate();