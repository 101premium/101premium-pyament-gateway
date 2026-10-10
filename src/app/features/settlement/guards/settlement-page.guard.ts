import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/data/auth.service';

const SETTLEMENT_PAGE_ROLES = new Set([
  'ROLE_SETTLEMENT',
  'ROLE_ADMIN',
  'ROLE_SUPER_ADMIN',
  'SUPER_ADMIN',
  'SUPERADMIN',
  'ROLE_ADMIN_USER',
  'ROLE_COMPLIANCE',
  'ROLE_MERCHANT_ADMIN'
]);

export const settlementPageGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const session = inject(AuthService).getSession();
  const allowed = [session?.role, ...(session?.permissions ?? [])]
    .map((value) => value?.trim().toUpperCase().replace(/[\s-]+/g, '_'))
    .some((authority) => SETTLEMENT_PAGE_ROLES.has(authority ?? ''));

  return allowed ? true : inject(Router).createUrlTree(['/dashboard']);
};
