export interface CreatePaymentLinkRequest {
  reference: string;
  firstName: string;
  lastName: string;
  amount: string;
  currency: string;
  email: string;
  countryCode: string;
  redirectUrl: string;
  address: string;
  city: string;
  phoneNumber: string;
  env: string;
}

export interface CreatedPaymentLink {
  reference: string;
  checkoutUrl: string;
  amount: string;
  env: string;
}

export interface CreatePaymentLinkResponse {
  code: string;
  description: string;
  data: CreatedPaymentLink;
}

export interface PaymentLinkQuery {
  searchParam?: string;
  merchantId?: string;
  startDate?: string;
  endDate?: string;
  /** Zero-based page index; sent to the API as 1-based. */
  page: number;
  size: number;
}

/** Shape of a list item is not documented yet; refine once the response is known. */
export type PaymentLinkRecord = Record<string, unknown>;

export interface PaymentLinkPageData {
  data: PaymentLinkRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface PaymentLinkPageResponse {
  code: string;
  description: string;
  data: PaymentLinkPageData;
}

export interface PaymentLinkDetailsRequest {
  reference: string;
  env: string;
}

/** Fields of the details response are not documented yet; rendered generically. */
export type PaymentLinkDetails = Record<string, unknown>;

export interface PaymentLinkDetailsResponse {
  code: string;
  description: string;
  data: PaymentLinkDetails;
}
