import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authHeadersInterceptor } from './core/http/auth-headers.interceptor';
import { authExpiredInterceptor } from './core/http/auth-expired.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authHeadersInterceptor, authExpiredInterceptor])),
    provideRouter(routes),
    provideClientHydration(withEventReplay())
  ]
};
