import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/data/auth.service';
import { AppModeService } from '../services/app-mode.service';
import { environment } from '../../../environments/environment';

export const authHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  // Only decorate API requests headed to our backend.
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const appMode = inject(AppModeService);
  const session = authService.getSession();
  const isAuthEndpoint = req.url.startsWith(`${environment.apiBaseUrl}/auth/`);
  const requestUrl = req.url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
  const isPublicUserEndpoint = [
    `${environment.apiBaseUrl}/user/passwordactivation`,
    `${environment.apiBaseUrl}/user/forgetpassword`
  ].includes(requestUrl);

  let headers = req.headers;

  // Public password flows must never receive a stale session token.
  if (isPublicUserEndpoint && headers.has('Authorization')) {
    headers = headers.delete('Authorization');
  }

  if (!headers.has('accept')) {
    headers = headers.set('accept', '*/*');
  }

  if (!headers.has('appMode')) {
    headers = headers.set('appMode', String(appMode.mode()));
  }

  if (
    !isAuthEndpoint &&
    !isPublicUserEndpoint &&
    session?.accessToken &&
    !headers.has('Authorization')
  ) {
    headers = headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  return next(req.clone({ headers }));
};
