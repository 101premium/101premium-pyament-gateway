import { Routes } from '@angular/router';
import { guestGuard } from './guards/guest.guard';
import { ForgotPasswordPageComponent } from './pages/forgot-password/forgot-password-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { PasswordActivationPageComponent } from './pages/password-activation/password-activation-page.component';

export const authRoutes: Routes = [
  { path: 'login', component: LoginPageComponent, canActivate: [] },
  { path: 'forgot-password', component: ForgotPasswordPageComponent, canActivate: [guestGuard] },
  { path: 'account/change-password/:resetToken', component: PasswordActivationPageComponent }
];
