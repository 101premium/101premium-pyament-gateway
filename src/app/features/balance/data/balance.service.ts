import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { formatDisplayDate, initialsFromName } from '../../../shared/utils/format.utils';
import {
  BalancePageRecord,
  BalancePageResponse,
  BalancePageResult,
  BalanceQueryParams,
  BalanceRow
} from './balance.models';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly http = inject(HttpClient);
  private readonly balancePageUrl = `${environment.apiBaseUrl}/balance/page`;

  /**
   * GET .../balance/page — response shape:
   * `{ code, description, data: { data[], currentPage, totalPages, totalItems } }`.
   */
  getBalances(query: BalanceQueryParams): Observable<BalancePageResult> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('size', String(query.size));
    const search = query.searchParam?.trim();
    if (search) {
      params = params.set('searchParam', search);
    }
    const merchantId = query.merchantId?.trim();
    if (merchantId) {
      params = params.set('merchantId', merchantId);
    }

    return this.http
      .get<BalancePageResponse>(this.balancePageUrl, { params })
      .pipe(map(mapBalancePageResponse));
  }
}

function mapBalancePageResponse(res: BalancePageResponse): BalancePageResult {
  const page = res.data;
  const rows = page?.data ?? [];

  return {
    items: rows.map(toBalanceRow),
    currentPage: page?.currentPage ?? 0,
    totalPages: page?.totalPages ?? 0,
    totalItems: page?.totalItems ?? 0
  };
}

function toBalanceRow(row: BalancePageRecord): BalanceRow {
  const currency = text(row.currency, 'Currency unavailable');
  const merchantId = text(row.merchantId, 'Merchant unavailable');
  const network = text(row.network, 'Network unavailable');
  const uniqueId = text(row.uniqueId, 'Balance ID unavailable');
  const status = labelForBalanceStatus(row.status);

  return {
    avatarText: initialsFromName(currency),
    primaryText: `${currency} balance`,
    secondaryText: `${merchantId} · ${network} · ${uniqueId}`,
    statusText: status,
    statusClass: statusClassForBalanceStatus(status),
    amountText: formatBalanceAmount(row.balance, currency),
    metaText: formatDisplayDate(row.createdDate)
  };
}

function text(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function formatBalanceAmount(amount: string | number, currency: string): string {
  const numericValue =
    typeof amount === 'number' ? amount : Number(String(amount).replace(/[^0-9.-]/g, ''));

  if (Number.isFinite(numericValue)) {
    return `${numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    })} ${currency}`;
  }

  const fallback = String(amount ?? '').trim();
  return fallback ? `${fallback} ${currency}` : `0.00 ${currency}`;
}

function labelForBalanceStatus(status: string): string {
  switch (status?.trim()) {
    case '1':
      return 'Active';
    case '0':
      return 'Inactive';
    default:
      return status?.trim() || 'Unknown';
  }
}

function statusClassForBalanceStatus(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized === '1') {
    return 'succeeded';
  }
  if (normalized.includes('inactive') || normalized === '0') {
    return 'failed';
  }
  return 'pending';
}
