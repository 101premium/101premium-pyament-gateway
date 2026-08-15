import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  formatCurrencyAmount,
  formatDisplayDate,
  formatMoney,
  initialsFromName,
  statusClassForLabel,
  titleCase
} from '../../../shared/utils/format.utils';
import { normalizeApiPageIndex } from '../../../shared/utils/pagination.utils';
import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import {
  SettlementDetailPageResponse,
  SettlementDetailRecord,
  SettlementDownloadQuery,
  SettlementDownloadResponse,
  SettlementUploadResponse,
  SettlementPageRecord,
  SettlementPageResponse,
  SettlementPageResult,
  SettlementQueryParams
} from './settlement.models';

@Injectable({ providedIn: 'root' })
export class SettlementService {
  private readonly http = inject(HttpClient);
  private readonly settlementPageUrl = `${environment.apiBaseUrl}/settlement/page`;
  private readonly settlementDetailPageUrl = `${environment.apiBaseUrl}/settlement/page/details`;
  private readonly settlementDownloadUrl = `${environment.apiBaseUrl}/settlement/download`;
  private readonly settlementUploadUrl = `${environment.apiBaseUrl}/settlement/upload`;

  getSettlements(query: SettlementQueryParams): Observable<SettlementPageResult> {
    let params = new HttpParams()
      .set('page', String(query.page + 1))
      .set('size', String(query.size));

    const merchantId = query.merchantId?.trim();
    if (merchantId) {
      params = params.set('merchantId', merchantId);
    }

    return this.http
      .get<SettlementPageResponse>(this.settlementPageUrl, { params })
      .pipe(map(mapSettlementPageResponse));
  }

  getSettlementDetails(query: SettlementQueryParams): Observable<SettlementPageResult> {
    let params = new HttpParams()
      .set('page', String(query.page + 1))
      .set('size', String(query.size));

    const merchantId = query.merchantId?.trim();
    const tranDate = query.tranDate?.trim();
    if (merchantId) {
      params = params.set('merchantId', merchantId);
    }
    if (tranDate) {
      params = params.set('tranDate', tranDate);
    }

    return this.http
      .get<SettlementDetailPageResponse>(this.settlementDetailPageUrl, { params })
      .pipe(map(mapSettlementDetailPageResponse));
  }

  downloadSettlements(query: SettlementDownloadQuery): Observable<SettlementDownloadResponse> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(query)) {
      const normalizedValue = value?.trim();
      if (normalizedValue) {
        params = params.set(key, normalizedValue);
      }
    }

    return this.http.get<SettlementDownloadResponse>(this.settlementDownloadUrl, { params });
  }

  uploadSettlement(file: File): Observable<SettlementUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<SettlementUploadResponse>(this.settlementUploadUrl, formData);
  }
}

function mapSettlementPageResponse(response: SettlementPageResponse): SettlementPageResult {
  const page = response.data;
  const rows = page?.data ?? [];

  return {
    items: rows.map(toSettlementRow),
    currentPage: normalizeApiPageIndex(page?.currentPage),
    totalPages: page?.totalPages ?? 0,
    totalItems: page?.totalItems ?? 0
  };
}

function toSettlementRow(row: SettlementPageRecord): SummaryTableRow {
  const currency = row.currency?.trim() || 'NGN';
  const merchantName = row.merchantName?.trim() || 'Unknown merchant';
  const merchantId = row.merchantId?.trim();

  return {
    route: '/settlement/details',
    queryParams: buildSettlementDetailQueryParams(row),
    avatarText: merchantInitials(merchantName),
    primaryText: formatSettlementDate(row.tranDate),
    secondaryText: merchantId ? `${merchantName} · ${merchantId}` : merchantName,
    statusText: `${row.transactionCount ?? 0}`,
    statusTone: 'pending',
    amountText: formatSettlementAmount(row.amount, currency),
    transactionTypeText: formatSettlementAmount(row.fee, currency),
    metaText: formatSettlementAmount(row.settlementAmount, currency)
  };
}

function buildSettlementDetailQueryParams(row: SettlementPageRecord): Record<string, string> {
  const params: Record<string, string> = {};
  const merchantId = row.merchantId?.trim();
  const tranDate = row.tranDate?.trim();

  if (merchantId) {
    params['merchantId'] = merchantId;
  }
  if (tranDate) {
    params['tranDate'] = tranDate;
  }

  return params;
}

function mapSettlementDetailPageResponse(response: SettlementDetailPageResponse): SettlementPageResult {
  const page = response.data;
  const rows = page?.data ?? [];

  return {
    items: rows.map(toSettlementDetailRow),
    currentPage: normalizeApiPageIndex(page?.currentPage),
    totalPages: page?.totalPages ?? 0,
    totalItems: page?.totalItems ?? 0
  };
}

function toSettlementDetailRow(row: SettlementDetailRecord): SummaryTableRow {
  const customerName =
    [row.firstName, row.lastName]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim() ||
    row.merchantName?.trim() ||
    row.ref?.trim() ||
    'Unknown customer';
  const status = labelForSettlementStatus(row);
  const currency = row.currency?.trim() || 'NGN';

  return {
    route: buildCardTransactionRoute(row),
    avatarText: initialsFromName(customerName),
    primaryText: customerName,
    secondaryText: row.cardPan?.trim() || row.email?.trim() || row.merchantId?.trim() || 'No card details provided',
    statusText: status,
    statusTone: statusClassForLabel(status),
    amountText: formatSettlementAmount(row.amount, currency),
    transactionTypeText: row.cardType?.trim() || row.transactionType?.trim() || '--',
    detailText: settlementStatusText(row.settlementStatus),
    detailTone: settlementStatusTone(row.settlementStatus),
    metaText: formatDisplayDate(row.createdDate)
  };
}

function buildCardTransactionRoute(row: SettlementDetailRecord): string | undefined {
  const key =
    row.transactionId?.trim() ||
    row.ref?.trim() ||
    row.paymentReference?.trim() ||
    (row.id !== null && row.id !== undefined ? String(row.id) : '');

  return key ? `/payment/card-transactions/${encodeURIComponent(key)}` : undefined;
}

function labelForSettlementStatus(row: SettlementDetailRecord): string {
  switch (row.transactionStatus) {
    case '00':
      return 'SUCCESSFUL';
    case '01':
      return 'Pending';
    case '02':
      return 'Failed';
    default: {
      const message = row.transactionMessage?.trim();
      return message ? titleCase(message) : 'Unknown';
    }
  }
}

function settlementStatusText(value: string | null): string {
  return value?.trim() || 'Pending';
}

function settlementStatusTone(value: string | null): string {
  return statusClassForLabel(settlementStatusText(value));
}

function normalizePageIndex(currentPage: number, totalPages: number): number {
  if (totalPages > 0 && currentPage >= totalPages) {
    return Math.max(0, currentPage - 1);
  }

  return Math.max(0, currentPage);
}

function merchantInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '--';
}

function formatSettlementDate(value: string): string {
  const formatted = formatDisplayDate(value);
  return formatted === 'Date unavailable' ? 'Date unavailable' : formatted;
}

function formatSettlementAmount(value: string | number, currency: string): string {
  if (typeof value === 'number') {
    return formatCurrencyAmount(value, currency);
  }

  return formatMoney(value, currency);
}
