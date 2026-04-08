import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/data/auth.service';
import { environment } from '../../../environments/environment';

export const authHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  // Only decorate API requests headed to our backend.
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const session = authService.getSession();
  const isAuthEndpoint = req.url.startsWith(`${environment.apiBaseUrl}/auth/`);

  let headers = req.headers;

  if (!headers.has('accept')) {
    headers = headers.set('accept', '*/*');
  }

  if (!headers.has('appMode')) {
    headers = headers.set('appMode', '0');
  }

  if (!isAuthEndpoint && session?.accessToken && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  return next(req.clone({ headers }));
};
