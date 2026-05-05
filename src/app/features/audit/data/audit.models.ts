import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';

export interface AuditQueryParams {
  searchParam?: string;
  merchantId?: string;
  page: number;
  size: number;
}

export interface AuditPageResult {
  items: SummaryTableRow[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface AuditListItem {
  id: number;
  uniqueId: string | null;
  email: string | null;
  event: string | null;
  flag: string | null;
  request: string | null;
  ipAddress: string | null;
  status: number | null;
  merchantId: string | null;
  requestTime: string | null;
}

export interface AuditPageData {
  data: AuditListItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface AuditListResponse {
  code: string;
  description: string;
  data: AuditPageData;
}

export interface AuditDetailResponse {
  code: string;
  description: string;
  data: AuditListItem;
}

export interface AuditDetailView {
  id: string;
  uniqueId: string;
  email: string;
  event: string;
  flag: string;
  request: string;
  ipAddress: string;
  merchantId: string;
  statusText: string;
  statusTone: string;
  requestTime: string;
}
