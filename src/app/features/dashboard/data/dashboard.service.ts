import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DashboardChartBar,
  DashboardGraphPoint,
  DashboardGraphResponse,
  DashboardStatsData,
  DashboardStatsResponse
} from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiBaseUrl}/dashboard`;
  private readonly graphUrl = `${environment.apiBaseUrl}/dashboard/graph`;

  getStats(transactionType?: string): Observable<DashboardStatsData> {
    let params = new HttpParams();
    if (transactionType) {
      params = params.set('transactionType', transactionType);
    }
    return this.http
      .get<DashboardStatsResponse>(this.dashboardUrl, { params })
      .pipe(map((res) => res.data));
  }

  getGraph(transactionType: string): Observable<DashboardChartBar[]> {
    const params = new HttpParams().set('transactionType', transactionType);
    return this.http
      .get<DashboardGraphResponse>(this.graphUrl, { params })
      .pipe(map((res) => this.mapGraphPoints(res.data ?? [])));
  }

  private mapGraphPoints(points: DashboardGraphPoint[]): DashboardChartBar[] {
    const year = points.length
      ? Number(points[0].month.split('-')[0])
      : new Date().getFullYear();

    const amountByMonth = new Map(points.map((p) => [p.month, p.totalAmount]));

    const allMonths: DashboardChartBar[] = Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
      const amount = amountByMonth.get(monthKey) ?? 0;
      return { height: 0, label: this.formatMonth(monthKey), amount, monthKey };
    });

    const max = Math.max(...allMonths.map((b) => b.amount));
    return allMonths.map((b) => ({
      ...b,
      height: max > 0 && b.amount > 0 ? Math.max(8, Math.round((b.amount / max) * 92)) : 0
    }));
  }

  private formatMonth(month: string): string {
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  }
}
