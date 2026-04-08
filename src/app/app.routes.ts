import { Routes } from '@angular/router';
import { authGuard } from './features/auth/guards/auth.guard';
import { authRoutes } from './features/auth/auth.routes';
import { userRoutes } from './features/users/users.routes';
import { coreRoutes } from './core/core.routes';
import { MerchantLayoutComponent } from './shared/layout/merchant-layout.component';
import { merchantLayoutRoutes } from './shared/layout/merchant-layout.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  ...coreRoutes,
  { path: 'auth', children: authRoutes },
  {
    path: '',
    component: MerchantLayoutComponent,
    canActivate: [authGuard],
    children: merchantLayoutRoutes
  },
  { path: 'users', children: userRoutes },
  { path: '**', redirectTo: 'auth/login' }
];
