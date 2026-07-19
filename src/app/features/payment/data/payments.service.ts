import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  formatDisplayDate,
  formatCurrencyAmount,
  formatMoney,
  initialsFromName,
  statusClassForLabel,
  titleCase
} from '../../../shared/utils/format.utils';
import {
  PaymentQueryParams,
  PaymentAsset,
  PaymentAssetNetwork,
  PaymentAssetNetworksResponse,
  PaymentAssetsResponse,
  PayoutRequest,
  PayoutResponse,
  PaymentWalletRequest,
  PaymentWalletResponse,
  PaymentTransaction,
  PaymentTransactionDetailView,
  PaymentTransactionPageResult,
  TransactionPageRecord,
  TransactionDetailResponse,
  TransactionPageResponse,
  WalletStatusRequest,
  WalletStatusResult,
  WalletStatusResponse
} from './payments.models';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly transactionPageUrl = `${environment.apiBaseUrl}/transaction/page`;
  private readonly cardTransactionPageUrl = `${environment.apiBaseUrl}/card/transaction/page`;
  private readonly transactionDetailUrl = `${environment.apiBaseUrl}/transaction`;
  private readonly cardTransactionDetailUrl = `${environment.apiBaseUrl}/card/transaction`;
  private readonly paymentAssetsUrl = `${environment.apiBaseUrl}/payment/assets`;
  private readonly paymentAssetNetworksUrl = `${environment.apiBaseUrl}/payment/assets/network`;
  private readonly walletPayoutUrl = `${environment.apiBaseUrl}/payment/wallet/payout`;
  private readonly paymentWalletUrl = `${environment.apiBaseUrl}/payment/wallet`;
  private readonly walletStatusUrl = `${environment.apiBaseUrl}/payment/wallet/status`;

  /**
   * GET …/transaction/page — response shape:
   * `{ code, description, data: { data[], currentPage, totalPages, totalItems } }`.
   */
  getTransactions(query: PaymentQueryParams): Observable<PaymentTransactionPageResult> {
    let params = new HttpParams()
      .set('page', String(query.page + 1))
      .set('size', String(query.size));
    const merchantId = query.merchantId?.trim();
    const cryptoMode = query.cryptoMode?.trim();
    if (merchantId) {
      params = params.set('merchantId', merchantId);
    }

     if (cryptoMode) {
      params = params.set('cryptoMode', cryptoMode);
    }
    
    const search = query.searchParam?.trim();
    if (search) {
      params = params.set('searchParam', search);
    }

    const routePrefix = query.routePrefix ?? '/payment';

    return this.http
      .get<TransactionPageResponse>(this.transactionPageUrl, { params })
      .pipe(map((res) => mapTransactionPageResponse(res, routePrefix)));
  }

  getCardTransactions(query: PaymentQueryParams): Observable<PaymentTransactionPageResult> {
    let params = new HttpParams()
      .set('page', String(query.page + 1))
      .set('size', String(query.size));

    const search = query.searchParam?.trim();
    if (search) {
      params = params.set('searchParam', search);
    }

    return this.http
      .get<TransactionPageResponse>(this.cardTransactionPageUrl, { params })
      .pipe(map(mapCardTransactionPageResponse));
  }

  getTransactionDetail(transactionId: string): Observable<PaymentTransactionDetailView> {
    return this.http
      .get<TransactionDetailResponse>(`${this.transactionDetailUrl}/${encodeURIComponent(transactionId)}`)
      .pipe(map((response) => this.mapTransactionDetailForView(response)));
  }

  getCardTransactionDetail(transactionId: string): Observable<PaymentTransactionDetailView> {
    return this.http
      .get<TransactionDetailResponse>(`${this.cardTransactionDetailUrl}/${encodeURIComponent(transactionId)}`)
      .pipe(map((response) => this.mapTransactionDetailForView(response)));
  }

  getPaymentAssets(): Observable<PaymentAsset[]> {
    return this.http
      .get<PaymentAssetsResponse>(this.paymentAssetsUrl)
      .pipe(map((response) => response.data ?? []));
  }

  getPaymentAssetNetworks(coin: string): Observable<PaymentAssetNetwork[]> {
    const params = new HttpParams().set('coin', coin);

    return this.http
      .get<PaymentAssetNetworksResponse>(this.paymentAssetNetworksUrl, { params })
      .pipe(map((response) => response.data ?? []));
  }

  initiateWalletPayout(payload: PayoutRequest): Observable<PayoutResponse> {
    return this.http.post<PayoutResponse>(this.walletPayoutUrl, payload);
  }

  createPaymentWallet(payload: PaymentWalletRequest): Observable<PaymentWalletResponse> {
    return this.http.post<PaymentWalletResponse>(this.paymentWalletUrl, payload);
  }

  checkWalletStatus(payload: WalletStatusRequest): Observable<WalletStatusResult | null> {
    return this.http
      .post<WalletStatusResponse>(this.walletStatusUrl, payload)
      .pipe(map((res) => res.data ?? null));
  }

  mapTransactionDetailForView(response: TransactionDetailResponse): PaymentTransactionDetailView {
    const row = extractTransactionDetailRecord(response);
    const status = labelForTransactionStatus(row);
    const customerName =
      [row.firstName, row.lastName]
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean)
        .join(' ')
        .trim() ||
      row.merchantName?.trim() ||
      row.ref?.trim() ||
      'Unknown customer';

    return {
      ref: row.ref?.trim() || '',
      reference: row.ref?.trim() || 'Unavailable',
      message: row.transactionMessage?.trim() || 'No status message provided',
      status,
      statusClass: statusClassForLabel(status),
      amount: formatTransactionAmount(row.amount, row.currency?.trim() || 'USD'),
      transactionType: row.transactionType?.trim() || 'Unavailable',
      customerName,
      email: row.email?.trim() || 'No email provided',
      createdDate: formatDisplayDate(row.createdDate),
      merchantName: row.merchantName?.trim() || 'Unknown merchant',
      merchantId: row.merchantId?.trim() || 'Unavailable',
      transactionId: row.transactionId?.trim() || 'Unavailable',
      paymentReference: row.paymentReference?.trim() || 'Unavailable',
      countryCode: row.countryCode?.trim() || 'Unavailable',
      rail: row.rail?.trim() || 'Unavailable',
      cardPan: row.cardPan?.trim() || 'Unavailable',
      cardType: row.cardType?.trim() || 'Unavailable',
      redirectUrl: row.redirectUrl?.trim() || 'Unavailable',
      checkoutUrl: row.checkoutUrl?.trim() || 'Unavailable',
      errorText: row.errorMessage?.trim() || row.errorReason?.trim() || 'No error recorded',
      cryptoMode: row.cryptoMode?.trim() || 'Unavailable',
      address: row.address?.trim() || 'Unavailable',
      settlementStatus: row.settlementStatus?.trim() || 'Unavailable',
      settlementDate: formatDisplayDate(row.settlementDate ?? ''),
      payoutAmount: formatOptionalTransactionAmount(row.payOutAmount, row.currency?.trim() || 'USD'),
      fees: formatOptionalTransactionAmount(row.fees, row.currency?.trim() || 'USD')
    };
  }
}

function mapTransactionPageResponse(res: TransactionPageResponse, routePrefix: string): PaymentTransactionPageResult {
  const page = res.data;
  const rows = page?.data ?? [];

  return {
    items: rows.map((row) => toPaymentTransaction(row, routePrefix)),
    currentPage: page?.currentPage ?? 0,
    totalPages: page?.totalPages ?? 0,
    totalItems: page?.totalItems ?? 0
  };
}

function mapCardTransactionPageResponse(res: TransactionPageResponse): PaymentTransactionPageResult {
  const page = res.data;
  const rows = page?.data ?? [];

  return {
    items: rows.map(toCardTransaction),
    currentPage: page?.currentPage ?? 0,
    totalPages: page?.totalPages ?? 0,
    totalItems: page?.totalItems ?? 0
  };
}

function toPaymentTransaction(row: TransactionPageRecord, routePrefix: string): PaymentTransaction {
  const name =
    [row.firstName, row.lastName]
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim() ||
    row.merchantName?.trim() ||
    row.ref?.trim() ||
    'Unknown customer';

  const status = labelForTransactionStatus(row);
  const currency = row.currency?.trim() || 'USD';

  return {
    route: buildTransactionRoute(row, routePrefix),
    initials: initialsFromName(name),
    name,
    email: row.email?.trim() || 'No email provided',
    status,
    statusClass: statusClassForLabel(status),
    amount: formatTransactionAmount(row.amount, currency),
    transactionType: row.transactionType?.trim() || '--',
    date: formatDisplayDate(row.createdDate)
  };
}

function toCardTransaction(row: TransactionPageRecord): PaymentTransaction {
  const name =
    [row.firstName, row.lastName]
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim() ||
    row.merchantName?.trim() ||
    row.ref?.trim() ||
    'Unknown customer';

  const status = labelForTransactionStatus(row);
  const currency = row.currency?.trim() || 'USD';
  const cardPan = row.cardPan?.trim();
  const email = row.email?.trim();

  return {
    route: buildTransactionRoute(row, '/payment/card-transactions'),
    initials: initialsFromName(name),
    name,
    email: cardPan || email || 'No card details provided',
    status,
    statusClass: statusClassForLabel(status),
    amount: formatTransactionAmount(row.amount, currency),
    transactionType: row.cardType?.trim() || row.transactionType?.trim() || '--',
    date: formatDisplayDate(row.createdDate)
  };
}

function buildTransactionRoute(row: TransactionPageRecord, routePrefix: string): string | undefined {
  const key =
    row.transactionId?.trim() ||
    row.ref?.trim() ||
    row.paymentReference?.trim() ||
    (row.id !== null && row.id !== undefined ? String(row.id) : '');

  return key ? `${routePrefix}/${encodeURIComponent(key)}` : undefined;
}

function extractTransactionDetailRecord(response: TransactionDetailResponse): TransactionPageRecord {
  const candidate = response?.data && typeof response.data === 'object' ? response.data : response;
  const record = candidate as Partial<TransactionPageRecord> | undefined;

  return {
    id: record?.id ?? null,
    merchantId: record?.merchantId ?? '',
    merchantName: record?.merchantName ?? '',
    ref: record?.ref ?? '',
    paymentReference: record?.paymentReference ?? null,
    transactionId: record?.transactionId ?? null,
    cardPan: record?.cardPan ?? null,
    firstName: record?.firstName ?? '',
    lastName: record?.lastName ?? '',
    amount: record?.amount ?? '0',
    currency: record?.currency ?? 'USD',
    email: record?.email ?? '',
    countryCode: record?.countryCode ?? '',
    redirectUrl: record?.redirectUrl ?? null,
    cardType: record?.cardType ?? null,
    transactionStatus: record?.transactionStatus ?? '',
    transactionMessage: record?.transactionMessage ?? '',
    transactionType: record?.transactionType ?? null,
    errorMessage: record?.errorMessage ?? null,
    errorReason: record?.errorReason ?? null,
    rail: record?.rail ?? null,
    checkoutUrl: record?.checkoutUrl ?? null,
    createdDate: record?.createdDate ?? '',
    ipAddress: record?.ipAddress ?? null,
    cryptoMode: record?.cryptoMode ?? null,
    address: record?.address ?? null,
    settlementStatus: record?.settlementStatus ?? null,
    settlementDate: record?.settlementDate ?? null,
    payOutAmount: record?.payOutAmount ?? null,
    fees: record?.fees ?? null
  };
}

function formatTransactionAmount(amount: string | number, currencyCode: string): string {
  if (typeof amount === 'number') {
    return formatCurrencyAmount(amount, currencyCode);
  }

  return formatMoney(amount, currencyCode);
}

function formatOptionalTransactionAmount(amount: string | number | null | undefined, currencyCode: string): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Unavailable';
  }

  return formatTransactionAmount(amount, currencyCode);
}

function labelForTransactionStatus(row: TransactionPageRecord): string {
  switch (row.transactionStatus) {
    case '00':
      return 'SUCCESSFUL';
    case '01':
      return 'Pending';
    case '02':
      return 'Failed';
    default: {
      const msg = row.transactionMessage?.toLowerCase() ?? '';
      if (msg.includes('success')) {
        return 'SUCCESSFUL';
      }
      if (msg.includes('pending') || msg.includes('process')) {
        return 'Pending';
      }
      if (msg.includes('declin') || msg.includes('fail')) {
        return 'Failed';
      }
      return titleCase(row.transactionMessage || row.transactionStatus || 'Unknown');
    }
  }
}
