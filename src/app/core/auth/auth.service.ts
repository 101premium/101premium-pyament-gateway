import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSession, LoginRequest, LoginResponse } from '../../features/auth/data/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = '101premium.auth.session';
  private readonly loginUrl = `${environment.apiBaseUrl}/auth/login`;

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.loginUrl, payload, {
        headers: {
          accept: '*/*'
        }
      })
      .pipe(tap((response) => this.persistSession(response.data)));
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
