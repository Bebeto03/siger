import { HttpContextToken } from '@angular/common/http';

/**
 * Marca requisições de segundo plano (ex.: polling de notificações): não exibem o loading global
 * e não disparam toasts de erro, para não interromper o usuário a cada ciclo.
 */
export const BACKGROUND_REQUEST = new HttpContextToken<boolean>(() => false);
