/** Query for GET …/transaction/page — `merchantId` and `searchParam` are optional on the API. */
export interface PaymentQueryParams {
  searchParam?: string;
  merchantId?: string;
  page: number;
  size: number;
}

/** One element of `data.data` from GET …/transaction/page. */
export interface TransactionPageRecord {
  id: string | number | null;
  merchantId: string;
  merchantName: string;
  ref: string;
  paymentReference: string | null;
  transactionId: string | null;
  cardPan: string | null;
  firstName: string;
  lastName: string;
  amount: string | number;
  currency: string;
  email: string;
  countryCode: string;
  redirectUrl: string | null;
  transactionStatus: string;
  transactionMessage: string;
  errorMessage: string | null;
  errorReason: string | null;
  rail: string | null;
  checkoutUrl: string | null;
  createdDate: string;
}

/** Inner `data` object: list + pagination. */
export interface TransactionPageData {
  data: TransactionPageRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/** Full JSON body for a successful GET …/transaction/page. */
export interface TransactionPageResponse {
  code: string;
  description: string;
  data: TransactionPageData;
}

/** UI row for tables / cards. */
export interface PaymentTransaction {
  route?: string;
  initials: string;
  name: string;
  email: string;
  status: string;
  statusClass: string;
  amount: string;
  date: string;
}

export interface TransactionDetailResponse {
  code?: string;
  description?: string;
  data?: TransactionPageRecord | Record<string, unknown> | null;
}

export interface PaymentTransactionDetailView {
  reference: string;
  message: string;
  status: string;
  statusClass: string;
  amount: string;
  customerName: string;
  email: string;
  createdDate: string;
  merchantName: string;
  merchantId: string;
  transactionId: string;
  paymentReference: string;
  countryCode: string;
  rail: string;
  cardPan: string;
  redirectUrl: string;
  checkoutUrl: string;
  errorText: string;
}

/** Result returned by `PaymentsService.getTransactions`. */
export interface PaymentTransactionPageResult {
  items: PaymentTransaction[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface PaymentAsset {
  name: string;
  coin: string;
}

export interface PaymentAssetsResponse {
  code: string;
  description: string;
  data: PaymentAsset[];
}

export interface PaymentAssetNetwork {
  network: string;
  coin: string;
}

export interface PaymentAssetNetworksResponse {
  code: string;
  description: string;
  data: PaymentAssetNetwork[];
}

export interface PayoutRequest {
  reference: string;
  amount: number;
  coin: string;
  network: string;
  description: string;
  walletAddress: string;
}

export interface PayoutResponse {
  code?: string;
  description?: string;
  data?: unknown;
}

export interface PaymentWalletRequest {
  ref: string;
  coin: string;
  customEmail: string;
  network: string;
}

export interface PaymentWallet {
  ref: string;
  paymentReference: string;
  address: string;
  currency: string;
  network: string;
  message: string;
  notice: string;
  mode: string;
  transactionType: string;
}

export interface PaymentWalletResponse {
  code?: string;
  description?: string;
  data?: PaymentWallet | null;
}
