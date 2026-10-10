import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActivatePasswordRequest,
  ActivatePasswordResponse,
  AuthSession,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = '101premium.auth.session';
  private readonly loginUrl = `${environment.apiBaseUrl}/auth/login`;
  private readonly changePasswordUrl = `${environment.apiBaseUrl}/user/changepassword`;
  private readonly activatePasswordUrl = `${environment.apiBaseUrl}/user/passwordactivation`;
  private readonly forgotPasswordUrl = `${environment.apiBaseUrl}/user/forgetpassword`;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.loginUrl, payload, {
        headers: {
          accept: '*/*'
        }
      })
      .pipe(tap((response) => this.persistSession(response.data)));
  }

  changePassword(payload: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.put<ChangePasswordResponse>(this.changePasswordUrl, payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json'
      }
    });
  }

  activatePassword(payload: ActivatePasswordRequest): Observable<ActivatePasswordResponse> {
    return this.http.put<ActivatePasswordResponse>(this.activatePasswordUrl, payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json'
      }
    });
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.put<ForgotPasswordResponse>(this.forgotPasswordUrl, payload, {
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json'
      }
    });
  }

  logout(): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.removeItem(this.storageKey);
  }

  getSession(): AuthSession | null {
    if (!this.isBrowser()) {
      return null;
    }

    const rawSession = localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getSession()?.accessToken;
  }

  private persistSession(session: AuthSession): void {
    if (!this.isBrowser()) {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
