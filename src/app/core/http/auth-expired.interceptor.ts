import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/data/auth.service';

export const authExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isPasswordActivationRequest = req.url.startsWith(
    `${environment.apiBaseUrl}/user/passwordactivation`
  );

  return next(req).pipe(
    catchError((error: unknown) => {
      const isApiRequest = req.url.startsWith(environment.apiBaseUrl);

      if (
        isApiRequest &&
        !isPasswordActivationRequest &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        authService.logout();

        if (isPlatformBrowser(platformId) && window.location.pathname !== '/auth/login') {
          void router.navigateByUrl('/auth/login').catch(() => {
            window.location.assign('/auth/login');
          });
        }
      }

      return throwError(() => error);
    })
  );
};
