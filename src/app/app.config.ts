import { ApplicationConfig, LOCALE_ID, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Title } from '@angular/platform-browser';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import localePt from '@angular/common/locales/pt';

import { JwtModule } from '@auth0/angular-jwt';

import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DatePipe, registerLocaleData } from '@angular/common';
import { ErrorHandlerService } from './configuration/core/error-handler.service';
import { provideAnimations, provideNoopAnimations } from '@angular/platform-browser/animations';
import { LoadingService } from './configuration/core/loading.service';
import { AuthorizationService } from './configuration/security/authorization.service';
import { SystemService } from './configuration/core/system.service';
import { environment } from '../environment/environment';
import { tokenInterceptor } from './configuration/security/token.interceptor';
import { SegurancaGuard } from './configuration/security/seguranca.guard';
import { SegurancaDeactivateGuard } from './configuration/security/seguranca.deactivate.guard';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

registerLocaleData(localePt, 'pt-BR');

export function tokenGetter() {
  return localStorage.getItem("access_token");
}

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideAnimations(),
    provideNoopAnimations(),
    importProvidersFrom(
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: environment.tokenAllowedDomains,
          disallowedRoutes: environment.tokenDisallowedRoutes,
        },
      }),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
    ),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),

    //Provider Angular
    DatePipe,
    Title,
    { provide: LOCALE_ID, useValue: 'pt-BR' },

    //Provider PrimeNG
    MessageService,
    ConfirmationService,
    TranslateService,

    //Provider Criados
    AuthorizationService,
    SegurancaGuard,
    SegurancaDeactivateGuard,
    ErrorHandlerService,
    LoadingService,
    SystemService,
  ]
};