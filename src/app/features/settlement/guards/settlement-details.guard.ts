import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

const DETAILS_ROLES = new Set([
  'ROLE_SETTLEMENT',
  'ROLE_ADMIN',
  'ROLE_COMPLIANCE',
  'ROLE_MERCHANT_ADMIN'
]);

export const settlementDetailsGuard: CanActivateFn = () => {
  const session = inject(AuthService).getSession();
  const allowed = [session?.role, ...(session?.permissions ?? [])]
    .map((value) => value?.trim().toUpperCase().replace(/[\s-]+/g, '_'))
    .some((authority) => DETAILS_ROLES.has(authority ?? ''));

  return allowed ? true : inject(Router).createUrlTree(['/settlement']);
};
