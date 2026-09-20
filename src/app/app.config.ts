import { ApplicationConfig, LOCALE_ID, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { mockInterceptor } from './core/interceptors/mock.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { indicadoresFeature, IndicadoresEffects } from './store/indicadores';

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mockInterceptor, tokenInterceptor, loadingInterceptor, errorInterceptor])),

    // NgRx — estado global dos indicadores (RF29)
    provideStore({ [indicadoresFeature.name]: indicadoresFeature.reducer }),
    provideEffects([IndicadoresEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),

    DatePipe,
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
