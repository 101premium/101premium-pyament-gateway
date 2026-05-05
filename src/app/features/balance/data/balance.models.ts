/** Query for GET .../balance/page. */
export interface BalanceQueryParams {
  searchParam?: string;
  merchantId?: string;
  page: number;
  size: number;
}

/** One element of `data.data` from GET .../balance/page. */
export interface BalancePageRecord {
  id: string | number | null;
  currency: string;
  uniqueId: string;
  merchantId: string;
  network: string;
  balance: string | number;
  status: string;
  createdDate: string;
}

/** Inner `data` object: list + pagination. */
export interface BalancePageData {
  data: BalancePageRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/** Full JSON body for a successful GET .../balance/page. */
export interface BalancePageResponse {
  code: string;
  description: string;
  data: BalancePageData;
}

/** UI row for tables / cards. */
export interface BalanceRow {
  avatarText: string;
  primaryText: string;
  secondaryText: string;
  statusText: string;
  statusClass: string;
  amountText: string;
  metaText: string;
}

/** Result returned by `BalanceService.getBalances`. */
export interface BalancePageResult {
  items: BalanceRow[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}
