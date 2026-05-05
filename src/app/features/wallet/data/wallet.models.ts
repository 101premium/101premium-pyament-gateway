export interface WalletTransactionRecord {
  id: string | number | null;
  merchantId: string;
  merchantName: string;
  ref: string;
  paymentReference: string | null;
  transactionId: string | null;
  cardPan: string | null;
  firstName: string | null;
  lastName: string | null;
  amount: string | null;
  currency: string;
  email: string | null;
  countryCode: string | null;
  redirectUrl: string | null;
  transactionStatus: string | null;
  transactionMessage: string | null;
  errorMessage: string | null;
  errorReason: string | null;
  rail: string | null;
  cryptoMode: string;
  address: string;
  checkoutUrl: string | null;
  createdDate: string;
}

export interface WalletTransactionPageData {
  data: WalletTransactionRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface WalletTransactionPageResponse {
  code: string;
  description: string;
  data: WalletTransactionPageData;
}

export interface WalletTransaction {
  initials: string;
  address: string;
  merchantName: string;
  cryptoMode: string;
  cryptoModeClass: string;
  currency: string;
  amount: string;
  date: string;
  ref: string;
}

export interface WalletTransactionPageResult {
  items: WalletTransaction[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}
