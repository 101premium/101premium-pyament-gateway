import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { formatDisplayDate } from '../../../shared/utils/format.utils';
import {
  WalletTransaction,
  WalletTransactionRecord,
  WalletTransactionPageResponse,
  WalletTransactionPageResult
} from './wallet.models';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http = inject(HttpClient);
  private readonly walletPageUrl = `${environment.apiBaseUrl}/transaction/page/wallet`;

  getWalletTransactions(page: number, size: number): Observable<WalletTransactionPageResult> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http
      .get<WalletTransactionPageResponse>(this.walletPageUrl, { params })
      .pipe(map(mapWalletPageResponse));
  }
}

function mapWalletPageResponse(res: WalletTransactionPageResponse): WalletTransactionPageResult {
  const page = res.data;
  const rows = page?.data ?? [];

  return {
    items: rows.map(toWalletTransaction),
    currentPage: page?.currentPage ?? 0,
    totalPages: page?.totalPages ?? 0,
    totalItems: page?.totalItems ?? 0
  };
}

function toWalletTransaction(row: WalletTransactionRecord): WalletTransaction {
  const currency = row.currency?.trim() || 'CRYPTO';
  const initials = currency.slice(0, 2).toUpperCase();
  const cryptoMode = row.cryptoMode?.trim() || 'UNKNOWN';

  return {
    initials,
    address: row.address?.trim() || row.ref?.trim() || 'Unknown',
    merchantName: row.merchantName?.trim() || 'Unknown merchant',
    cryptoMode,
    cryptoModeClass: cryptoMode === 'CREDIT' ? 'successful' : 'pending',
    currency,
    amount: row.amount ? `${row.amount} ${currency}` : currency,
    date: formatDisplayDate(row.createdDate),
    ref: row.ref?.trim() || ''
  };
}
