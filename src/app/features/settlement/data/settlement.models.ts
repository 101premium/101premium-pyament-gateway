import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';

export interface SettlementQueryParams {
  merchantId?: string;
  tranDate?: string;
  page: number;
  size: number;
}

export interface SettlementDownloadQuery {
  merchantId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SettlementDownloadResponse {
  code: string;
  description: string;
  data: string;
}

export interface SettlementUploadRowError {
  row: number;
  cellErrMsg: string[];
}

export interface SettlementUploadResult {
  totalRecords: number;
  successCount: number;
  failedCount: number;
  errors: SettlementUploadRowError[];
}

export interface SettlementUploadResponse {
  code: string;
  description: string;
  data: SettlementUploadResult;
}

export interface SettlementPageRecord {
  merchantId: string;
  merchantName: string;
  currency: string | null;
  tranDate: string;
  transactionCount: number;
  amount: string | number;
  settlementAmount: string | number;
  fee: string | number;
}

export interface SettlementPageData {
  data: SettlementPageRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface SettlementPageResponse {
  code: string;
  description: string;
  data: SettlementPageData;
}

export interface SettlementPageResult {
  items: SummaryTableRow[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface SettlementDetailRecord {
  id: string | number | null;
  merchantId: string;
  merchantName: string;
  ref: string;
  transactionId: string | null;
  cardPan: string | null;
  firstName: string;
  lastName: string;
  amount: string | number;
  currency: string;
  email: string;
  countryCode: string;
  cardType: string | null;
  redirectUrl: string | null;
  transactionStatus: string;
  transactionMessage: string;
  paymentReference: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  ipAddress: string | null;
  sourceUrl: string | null;
  transactionType: string | null;
  rail: string | null;
  createdDate: string;
  settlementStatus: string | null;
  settlementDate: string | null;
  expirationTime: string | null;
}

export interface SettlementDetailPageData {
  data: SettlementDetailRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface SettlementDetailPageResponse {
  code: string;
  description: string;
  data: SettlementDetailPageData;
}
