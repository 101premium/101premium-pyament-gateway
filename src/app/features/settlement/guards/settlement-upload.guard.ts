import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

const UPLOAD_ROLES = new Set(['ROLE_SETTLEMENT', 'ROLE_ADMIN', 'ROLE_COMPLIANCE']);

export const settlementUploadGuard: CanActivateFn = () => {
  const session = inject(AuthService).getSession();
  const allowed = [session?.role, ...(session?.permissions ?? [])]
    .map((value) => value?.trim().toUpperCase().replace(/[\s-]+/g, '_'))
    .some((authority) => UPLOAD_ROLES.has(authority ?? ''));

  return allowed ? true : inject(Router).createUrlTree(['/settlement']);
};
