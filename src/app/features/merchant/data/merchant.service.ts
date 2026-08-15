import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  asRecord,
  asRecordArray,
  numberValue,
  stringValue
} from '../../../shared/utils/api-response.utils';
import {
  formatDisplayDate,
  initialsFromName,
  statusClassForLabel,
  titleCase
} from '../../../shared/utils/format.utils';
import { normalizeApiPageIndex } from '../../../shared/utils/pagination.utils';
import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import {
  CreateMerchantPayload,
  isMerchantEnvelope,
  MerchantApproveRejectPayload,
  MerchantDetailView,
  MerchantEnableDisablePayload,
  MerchantEnvelope,
  MerchantPageResult,
  MerchantQueryParams,
  MerchantStatData
} from './merchant.models';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private readonly http = inject(HttpClient);
  private readonly merchantPageUrl = `${environment.apiBaseUrl}/merchant/page`;
  private readonly merchantBaseUrl = `${environment.apiBaseUrl}/merchant`;

  /**
   * Single merchant profile. Expects `GET …/merchant/{uniqueId}` with the same envelope
   * shape as other merchant APIs (`data` holds the business record) or a raw record body.
   */
  getMerchant(uniqueId: string): Observable<MerchantDetailView> {
    const id = uniqueId.trim();
    return this.http.get<unknown>(`${this.merchantBaseUrl}/${encodeURIComponent(id)}`).pipe(
      map((response) => {
        const row = extractMerchantBusinessRecord(response);
        if (!row) {
          throw new Error('Merchant details are not available in the response.');
        }
        return mapMerchantDetailView(row);
      })
    );
  }

  /**
   * `POST …/merchant` — creates a merchant. Returns `uniqueId` when the API includes it in the body.
   */
  createMerchant(payload: CreateMerchantPayload): Observable<{ uniqueId?: string }> {
    return this.http.post<unknown>(this.merchantBaseUrl, payload).pipe(
      map((response) => ({ uniqueId: extractCreatedMerchantUniqueId(response) }))
    );
  }

  /** `POST …/merchant/approvereject` — approve or reject a pending merchant. */
  approveRejectMerchant(payload: MerchantApproveRejectPayload): Observable<unknown> {
    return this.http.post<unknown>(`${this.merchantBaseUrl}/approvereject`, payload);
  }

  /** `PUT …/merchant/enabledisenable` — set merchant account active / inactive. */
  enableDisableMerchant(payload: MerchantEnableDisablePayload): Observable<unknown> {
    return this.http.put<unknown>(`${this.merchantBaseUrl}/enabledisenable`, payload);
  }

  getMerchants(query: MerchantQueryParams): Observable<MerchantPageResult> {
    const params = new HttpParams().set('page', String(query.page + 1)).set('size', String(query.size));

    return this.http.get<MerchantEnvelope>(this.merchantPageUrl, { params }).pipe(
      map((response) => {
        const page = extractPageEnvelope(response, query.size);
        const rows = page.items.map(mapMerchantRow);

        return {
          items: rows,
          currentPage: page.currentPage,
          totalPages: page.totalPages,
          totalItems: page.totalItems
        };
      })
    );
  }

  /** `GET …/merchant/stat` — aggregate merchant counts (uses Bearer from interceptor). */
  getMerchantStat(): Observable<MerchantStatData> {
    return this.http.get<unknown>(`${this.merchantBaseUrl}/stat`).pipe(map(parseMerchantStatResponse));
  }
}

function extractPageEnvelope(response: unknown, pageSize: number): {
  items: Record<string, unknown>[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
} {
  if (isMerchantEnvelope(response)) {
    const p = response.data;
    const totalItems = numberValue(p.totalItems) ?? p.data.length;
    let totalPages = numberValue(p.totalPages) ?? 0;
    if (totalPages <= 0 && totalItems > 0 && pageSize > 0) {
      totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    }
    if (totalPages <= 0 && p.data.length > 0) {
      totalPages = 1;
    }
    return {
      items: p.data.map((row) => row as unknown as Record<string, unknown>),
      currentPage: normalizeApiPageIndex(numberValue(p.currentPage)),
      totalPages,
      totalItems
    };
  }

  const payload = asRecord(response);
  const data = asRecord(payload?.['data']) ?? payload;
  const rows = asRecordArray(
    data?.['data'] ??
      data?.['content'] ??
      data?.['items'] ??
      data?.['merchants'] ??
      payload?.['items'] ??
      payload?.['merchants']
  );

  const totalItems =
    numberValue(data?.['totalElements']) ??
    numberValue(data?.['totalItems']) ??
    numberValue(payload?.['totalElements']) ??
    numberValue(payload?.['totalItems']) ??
    rows.length;

  let totalPages =
    numberValue(data?.['totalPages']) ?? numberValue(payload?.['totalPages']) ?? 0;
  if (totalPages <= 0 && totalItems > 0 && pageSize > 0) {
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  }
  if (totalPages <= 0 && rows.length > 0) {
    totalPages = 1;
  }

  const currentPage =
    numberValue(data?.['number']) ??
    numberValue(data?.['page']) ??
    numberValue(data?.['currentPage']) ??
    numberValue(payload?.['currentPage']) ??
    0;

  return {
    items: rows,
    currentPage: normalizeApiPageIndex(currentPage),
    totalPages,
    totalItems
  };
}

function mapMerchantRow(row: Record<string, unknown>): SummaryTableRow {
  if (stringValue(row['businessName'])) {
    return mapBusinessMerchantRow(row);
  }
  return mapTransactionFeedRow(row);
}

function mapBusinessMerchantRow(row: Record<string, unknown>): SummaryTableRow {
  const businessName = stringValue(row['businessName']) || 'Business';
  const merchantId = stringValue(row['merchantId']);
  const email = stringValue(row['businessEmail']);
  const phone = stringValue(row['businessPhone']);

  const secondaryParts: string[] = [];
  if (email) {
    secondaryParts.push(email);
  }
  if (phone) {
    secondaryParts.push(phone);
  }
  if (merchantId) {
    secondaryParts.push(`Merchant ${merchantId}`);
  }
  const secondaryText = secondaryParts.join(' · ') || '—';

  const { text: statusText, tone: statusTone } = formatBusinessAccountStatus(
    normalizeMerchantApproved(row),
    stringValue(row['status']),
    stringValue(row['reason'])
  );

  const cac = stringValue(row['cacNumber']);
  const tin = stringValue(row['tinNumber']);
  const regParts: string[] = [];
  if (cac) {
    regParts.push(`CAC ${cac}`);
  }
  if (tin) {
    regParts.push(`TIN ${tin}`);
  }
  const amountText = regParts.join(' · ') || '—';

  const created =
    stringValue(row['createdDate']) ||
    stringValue(row['createdAt']) ||
    stringValue(row['dateCreated']) ||
    '';

  const uniqueId = stringValue(row['uniqueId']);
  const route = uniqueId ? `/merchants/${encodeURIComponent(uniqueId)}` : undefined;

  return {
    initials: initialsFromName(businessName),
    primaryText: businessName,
    secondaryText: secondaryText,
    statusText,
    statusTone,
    amountText,
    metaText: formatDisplayDate(created),
    route
  };
}

function formatBusinessAccountStatus(
  approved: string,
  status: string,
  reason: string
): { text: string; tone: string } {
  if (approved === '0') {
    return { text: reason ? `Pending approval (${reason})` : 'Pending approval', tone: 'pending' };
  }

  if (approved === '1' && status === '1') {
    return { text: 'Active', tone: 'succeeded' };
  }

  if (approved === '1' && status === '2') {
    return { text: 'Inactive', tone: 'failed' };
  }

  if (approved === '1') {
    return { text: `Approved · status ${status || '—'}`, tone: 'pending' };
  }

  const bits = [`Approved ${approved || '—'}`, `Status ${status || '—'}`].join(', ');
  return { text: reason ? `${bits} (${reason})` : bits, tone: 'pending' };
}

function mapTransactionFeedRow(row: Record<string, unknown>): SummaryTableRow {
  const merchantName = stringValue(row['merchantName']) || 'Merchant';
  const merchantId = stringValue(row['merchantId']);
  const customer = [stringValue(row['firstName']), stringValue(row['lastName'])].filter(Boolean).join(' ').trim();
  const email = stringValue(row['email']);
  const ref = stringValue(row['ref']);

  const secondaryParts: string[] = [];
  if (customer) {
    secondaryParts.push(customer);
  }
  if (email) {
    secondaryParts.push(email);
  }
  if (merchantId) {
    secondaryParts.push(`ID ${merchantId}`);
  }
  if (ref) {
    secondaryParts.push(`Ref ${ref}`);
  }
  const secondaryText = secondaryParts.join(' · ') || '—';

  const txCode = stringValue(row['transactionStatus']);
  const txMessage = stringValue(row['transactionMessage']);
  const statusText = formatTransactionLabel(txCode, txMessage);
  const statusTone = transactionStatusTone(txCode, txMessage);

  const amount = stringValue(row['amount']);
  const currency = stringValue(row['currency']);
  const amountText =
    amount && currency ? `${amount} ${currency}` : amount || currency || '—';

  const created =
    stringValue(row['createdDate']) ||
    stringValue(row['createdAt']) ||
    stringValue(row['dateCreated']) ||
    '';

  const avatarName = customer || merchantName;

  return {
    initials: initialsFromName(avatarName),
    primaryText: merchantName,
    secondaryText: secondaryText,
    statusText,
    statusTone,
    amountText,
    transactionType: stringValue(row['transactionType']) || undefined,
    metaText: formatDisplayDate(created)
  };
}

function formatTransactionLabel(code: string, message: string): string {
  if (message) {
    return titleCase(message.replace(/_/g, ' ').toLowerCase());
  }
  const c = code.trim();
  if (c === '00') {
    return 'Successful';
  }
  if (c === '01') {
    return 'Pending';
  }
  if (c === '02') {
    return 'Declined';
  }
  return c || '—';
}

function transactionStatusTone(code: string, message: string): string {
  const c = code.trim();
  if (c === '00') {
    return 'succeeded';
  }
  if (c === '01') {
    return 'pending';
  }
  if (c === '02') {
    return 'failed';
  }
  return statusClassForLabel(message);
}

function extractCreatedMerchantUniqueId(response: unknown): string | undefined {
  const row = extractMerchantBusinessRecord(response);
  const fromRow = row ? stringValue(row['uniqueId']) : '';
  if (fromRow) {
    return fromRow;
  }
  const root = asRecord(response);
  const data = root ? asRecord(root['data']) : null;
  const fromData = data ? stringValue(data['uniqueId']) : '';
  return fromData || undefined;
}

function parseMerchantStatResponse(response: unknown): MerchantStatData {
  const root = asRecord(response);
  const data = asRecord(root?.['data']) ?? root;
  return {
    totalMerchant: numberValue(data?.['totalMerchant']) ?? 0,
    activeMerchant: numberValue(data?.['activeMerchant']) ?? 0,
    inactiveMerchant: numberValue(data?.['inactiveMerchant']) ?? 0,
    deactivatedMerchant: numberValue(data?.['deactivatedMerchant']) ?? 0,
    approved: numberValue(data?.['approved']) ?? 0,
    pendingApproval: numberValue(data?.['pendingApproval']) ?? 0,
    rejectedApproval: numberValue(data?.['rejectedApproval']) ?? 0
  };
}

function extractMerchantBusinessRecord(response: unknown): Record<string, unknown> | null {
  const root = asRecord(response);
  if (!root) {
    return null;
  }
  if (stringValue(root['businessName'])) {
    return root;
  }
  const data = asRecord(root['data']);
  if (data && stringValue(data['businessName'])) {
    return data;
  }
  if (data) {
    const nested = asRecord(data['data']);
    if (nested && stringValue(nested['businessName'])) {
      return nested;
    }
  }
  return null;
}

function apiKeySummary(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return 'Not configured';
  }
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  if (!s) {
    return 'Not configured';
  }
  return s.length > 8 ? `${s.slice(0, 4)}…${s.slice(-4)}` : 'Configured';
}

/**
 * Maps various API shapes for “pending vs approved” to the string codes used in the UI (`"0"` pending, `"1"` approved).
 */
function normalizeMerchantApproved(row: Record<string, unknown>): string {
  const v =
    row['approved'] ??
    row['isApproved'] ??
    row['approvalStatus'] ??
    row['approval'];

  if (v === null || v === undefined) {
    return '';
  }
  if (typeof v === 'boolean') {
    return v ? '1' : '0';
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v === 0 ? '0' : String(Math.trunc(v));
  }
  const s = stringValue(v);
  if (!s) {
    return '';
  }
  const lower = s.toLowerCase();
  if (
    lower === 'false' ||
    lower === 'no' ||
    lower === 'pending' ||
    lower === 'awaiting_approval' ||
    lower === 'awaiting approval' ||
    lower === 'n'
  ) {
    return '0';
  }
  if (
    lower === 'true' ||
    lower === 'yes' ||
    lower === 'y' ||
    lower === 'approved' ||
    lower === 'approve' ||
    lower === 'accepted'
  ) {
    return '1';
  }
  return s;
}

function normalizeMerchantStatus(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '2';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) {
      return '1';
    }
    if (value === 0 || value === 2) {
      return '2';
    }
    return String(Math.trunc(value));
  }

  const s = stringValue(value);
  if (!s) {
    return '';
  }

  const lower = s.toLowerCase();
  if (
    lower === '1' ||
    lower === 'active' ||
    lower === 'enabled' ||
    lower === 'enable' ||
    lower === 'live'
  ) {
    return '1';
  }
  if (
    lower === '0' ||
    lower === '2' ||
    lower === 'inactive' ||
    lower === 'disabled' ||
    lower === 'disable' ||
    lower === 'suspended'
  ) {
    return '2';
  }

  return s;
}

function mapMerchantDetailView(row: Record<string, unknown>): MerchantDetailView {
  const businessName = stringValue(row['businessName']) || 'Business';
  const approvedCode = normalizeMerchantApproved(row);
  const statusCode = normalizeMerchantStatus(row['status']);
  const { text: statusText, tone: statusTone } = formatBusinessAccountStatus(
    approvedCode,
    statusCode,
    stringValue(row['reason']) || ''
  );

  const idRaw = row['id'];
  const internalId =
    typeof idRaw === 'number' && Number.isFinite(idRaw)
      ? String(idRaw)
      : stringValue(idRaw) || '—';

  const created =
    stringValue(row['createdDate']) ||
    stringValue(row['createdAt']) ||
    stringValue(row['dateCreated']) ||
    '';

  const updated =
    stringValue(row['updatedDate']) ||
    stringValue(row['updatedAt']) ||
    stringValue(row['dateUpdated']) ||
    '';

  return {
    businessName,
    merchantId: stringValue(row['merchantId']) || '—',
    uniqueId: stringValue(row['uniqueId']) || '—',
    businessEmail: stringValue(row['businessEmail']) || '—',
    businessPhone: stringValue(row['businessPhone']) || '—',
    businessAddress: stringValue(row['businessAddress']) || '—',
    cacNumber: stringValue(row['cacNumber']) || '—',
    tinNumber: stringValue(row['tinNumber']) || '—',
    processor: stringValue(row['processor']) || '—',
    cardVelocity:
      typeof row['cardVelocity'] === 'number'
        ? String(row['cardVelocity'])
        : stringValue(row['cardVelocity']) || '2',
    statusText,
    statusTone,
    approved: approvedCode,
    status: statusCode,
    reason: stringValue(row['reason']) || '',
    createdDate: formatDisplayDate(created),
    updatedDate: updated ? formatDisplayDate(updated) : '—',
    internalId,
    apiKeySummary: apiKeySummary(row['apiKey']),
    testApiKeySummary: apiKeySummary(row['testApiKey'])
  };
}
