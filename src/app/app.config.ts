import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';

import { provideNgxMask } from 'ngx-mask';
import { ThemeService } from './shared/components/themeselector/theme-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      inject(ThemeService); 
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNgxMask()
  ]
};
