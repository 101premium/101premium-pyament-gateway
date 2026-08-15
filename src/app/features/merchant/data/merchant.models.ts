import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { asRecord } from '../../../shared/utils/api-response.utils';

export interface MerchantQueryParams {
  page: number;
  size: number;
}

/** Body for `POST …/merchant/approvereject`. */
export interface MerchantApproveRejectPayload {
  uniqueId: string;
  approve: string;
  reason: string;
}

/** Body for `PUT …/merchant/enabledisenable`. */
export interface MerchantEnableDisablePayload {
  uniqueId: string;
  /** Account state (same codes as merchant record: e.g. `"1"` active, `"2"` inactive). */
  status: string;
}

/** Body for `POST …/merchant` (create merchant). */
export interface CreateMerchantPayload {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  cacNumber: string;
  tinNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  processor: string;
}

export interface MerchantPageResult {
  items: SummaryTableRow[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/** Payload under `data` from `GET …/merchant/stat`. */
export interface MerchantStatData {
  totalMerchant: number;
  activeMerchant: number;
  inactiveMerchant: number;
  deactivatedMerchant: number;
  approved: number;
  pendingApproval: number;
  rejectedApproval: number;
}

/** Normalized merchant profile for the detail screen. */
export interface MerchantDetailView {
  businessName: string;
  merchantId: string;
  uniqueId: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  cacNumber: string;
  tinNumber: string;
  processor: string;
  cardVelocity: string;
  statusText: string;
  statusTone: string;
  /** Raw API flag: `"0"` pending, `"1"` approved, etc. */
  approved: string;
  /** Raw account status: `"1"` active, `"2"` inactive (when approved). */
  status: string;
  reason: string;
  createdDate: string;
  updatedDate: string;
  internalId: string;
  apiKeySummary: string;
  testApiKeySummary: string;
}

/**
 * Top-level envelope for `GET /merchant/page` (and similar list endpoints).
 *
 * @example
 * ```json
 * {
 *   "code": "200",
 *   "description": "Record fetched successfully !",
 *   "data": { "data": [...], "currentPage": 0, "totalPages": 1, "totalItems": 4 }
 * }
 * ```
 */
export interface MerchantEnvelope {
  /** Often `"200"`; some APIs return a numeric code. */
  code: string | number;
  description: string;
  data: MerchantPagePayload;
}

/**
 * Paginated payload nested under `data` in {@link MerchantEnvelope}.
 */
export interface MerchantPagePayload {
  data: MerchantBusinessRecord[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Single merchant business profile row in `data.data[]`.
 */
export interface MerchantBusinessRecord {
  id: number;
  uniqueId: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  cacNumber: string;
  tinNumber: string;
  processor: string | null;
  cardVelocity?: number | string | null;
  merchantId: string;
  /** Account state code from API (e.g. `"1"` active, `"2"` inactive). */
  status: string;
  /** Approval flag (e.g. `"1"` approved, `"0"` pending). */
  approved: string;
  reason: string | null;
  createdDate: string;
  updatedDate: string | null;
  createdBy: number;
  updatedBy: number | null;
  apiKey: string | null;
  testApiKey: string | null;
}

/** Narrowing guard for {@link MerchantEnvelope}. */
export function isMerchantEnvelope(value: unknown): value is MerchantEnvelope {
  const root = asRecord(value);
  if (!root || root['code'] === undefined || root['code'] === null) {
    return false;
  }
  const data = asRecord(root['data']);
  if (!data || !Array.isArray(data['data'])) {
    return false;
  }
  return true;
}

/** Legacy / alternate row shape (transaction lines on merchant feed). */
export interface MerchantTransactionFeedRecord {
  merchantId?: string | null;
  merchantName?: string | null;
  ref?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  amount?: string | null;
  currency?: string | null;
  email?: string | null;
  transactionStatus?: string | null;
  transactionMessage?: string | null;
  transactionType?: string | null;
  createdDate?: string | null;
}
