import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiKeyData, ApiKeyResponse } from './api-key.models';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private readonly http = inject(HttpClient);
  private readonly keysUrl = `${environment.apiBaseUrl}/merchant/keys`;

  getKeys(): Observable<ApiKeyData> {
    return this.http
      .get<ApiKeyResponse>(this.keysUrl)
      .pipe(map((res) => res.data ?? { apiKey: null, testApiKey: null }));
  }
}
