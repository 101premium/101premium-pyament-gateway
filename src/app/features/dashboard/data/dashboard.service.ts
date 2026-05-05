import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardStatsData, DashboardStatsResponse } from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiBaseUrl}/dashboard`;

  getStats(): Observable<DashboardStatsData> {
    return this.http
      .get<DashboardStatsResponse>(this.dashboardUrl)
      .pipe(map((res) => res.data));
  }
}
