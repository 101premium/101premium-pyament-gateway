import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  PaymentLinkDetailsRequest,
  PaymentLinkDetailsResponse,
  PaymentLinkPageResponse,
  PaymentLinkQuery
} from './payment-link.models';

@Injectable({ providedIn: 'root' })
export class PaymentLinkService {
  private readonly http = inject(HttpClient);
  private readonly paymentLinkUrl = `${environment.apiBaseUrl}/payment-link`;
  private readonly paymentLinkDetailsUrl = `${environment.apiBaseUrl}/payment-link/details`;
  private readonly paymentLinkPageUrl = `${environment.apiBaseUrl}/payment-link/page`;

  /** POST …/payment-link */
  createPaymentLink(body: CreatePaymentLinkRequest): Observable<CreatePaymentLinkResponse> {
    return this.http.post<CreatePaymentLinkResponse>(this.paymentLinkUrl, body);
  }

  /** GET …/payment-link/page (appMode header added by the interceptor). */
  getPaymentLinks(query: PaymentLinkQuery): Observable<PaymentLinkPageResponse> {
    let params = new HttpParams()
      .set('page', String(query.page + 1))
      .set('size', String(query.size));

    for (const [key, value] of Object.entries({
      searchParam: query.searchParam,
      merchantId: query.merchantId,
      startDate: query.startDate,
      endDate: query.endDate
    })) {
      const normalizedValue = value?.trim();
      if (normalizedValue) {
        params = params.set(key, normalizedValue);
      }
    }

    return this.http.get<PaymentLinkPageResponse>(this.paymentLinkPageUrl, { params });
  }

  /** POST …/payment-link/details */
  getPaymentLinkDetails(body: PaymentLinkDetailsRequest): Observable<PaymentLinkDetailsResponse> {
    return this.http.post<PaymentLinkDetailsResponse>(this.paymentLinkDetailsUrl, body);
  }
}
