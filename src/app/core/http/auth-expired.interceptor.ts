import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/data/auth.service';
import { ToastService } from '../../shared/services/toast.service';

export const authExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const platformId = inject(PLATFORM_ID);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        isPlatformBrowser(platformId) &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isProtectedApiRequest(req.url)
      ) {
        authService.logout();
        toast.show('Access denied. Please sign in again.', 'error');

        if (window.location.pathname !== '/auth/login') {
          router.navigateByUrl('/auth/login').then((navigated) => {
            if (!navigated) window.location.assign('/auth/login');
          }, () => {
            window.location.assign('/auth/login');
          });
        }
      }

      return throwError(() => error);
    })
  );
};

function isProtectedApiRequest(url: string): boolean {
  const requestPath = pathForUrl(url);

  if (!requestPath) {
    return false;
  }

  const apiBasePath = pathForUrl(environment.apiBaseUrl)?.replace(/\/+$/, '') ?? '';
  const isApiRequest =
    url.startsWith(environment.apiBaseUrl) ||
    requestPath === apiBasePath ||
    requestPath.startsWith(`${apiBasePath}/`);

  if (!isApiRequest) {
    return false;
  }

  return ![
    `${apiBasePath}/auth/login`,
    `${apiBasePath}/user/passwordactivation`
  ].some((excludedPath) => requestPath.startsWith(excludedPath));
}

function pathForUrl(url: string): string | null {
  try {
    return new URL(url, environment.apiBaseUrl).pathname;
  } catch {
    return null;
  }
}
