import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/data/auth.service';
import {
  asRecord,
  asRecordArray,
  numberValue,
  stringValue
} from '../../../shared/utils/api-response.utils';
import {
  formatDisplayDate,
  initialsFromName,
  titleCase
} from '../../../shared/utils/format.utils';
import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import {
  AuditDetailResponse,
  AuditDetailView,
  AuditListItem,
  AuditListResponse,
  AuditPageResult,
  AuditQueryParams
} from './audit.models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly auditUrl = `${environment.apiBaseUrl}/audit`;

  getAuditLogs(query: AuditQueryParams): Observable<AuditPageResult> {
    const session = this.authService.getSession();
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('size', String(query.size));

    const searchParam = query.searchParam?.trim();
    if (searchParam) {
      params = params.set('searchParam', searchParam);
    }

    const merchantId =
      query.merchantId?.trim() ||
      (session?.userCategory?.trim() === 'M' ? session.uniqueId?.trim() : '');
    if (merchantId) {
      params = params.set('merchantId', merchantId);
    }

    return this.http.get<AuditListResponse>(this.auditUrl, { params }).pipe(
      map((response) => {
        const page = extractPageEnvelope(response);
        return {
          items: page.items.map(mapAuditRow),
          currentPage: page.currentPage,
          totalPages: page.totalPages,
          totalItems: page.totalItems
        };
      })
    );
  }

  getAuditLog(auditId: string): Observable<AuditDetailView> {
    const id = auditId.trim();

    return this.http.get<AuditDetailResponse | unknown>(`${this.auditUrl}/${encodeURIComponent(id)}`).pipe(
      map((response) => {
        const record = extractAuditDetailRecord(response);
        if (!record) {
          throw new Error('Audit record is not available in the response.');
        }

        return mapAuditDetail(record);
      })
    );
  }
}

function extractPageEnvelope(response: unknown): {
  items: Record<string, unknown>[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
} {
  const payload = asRecord(response);
  const data = asRecord(payload?.['data']) ?? payload;
  const rows = asRecordArray(
    data?.['data'] ??
      data?.['content'] ??
      data?.['items'] ??
      data?.['audits'] ??
      data?.['records'] ??
      payload?.['items'] ??
      payload?.['audits']
  );

  return {
    items: rows,
    currentPage: numberValue(data?.['currentPage']) ?? numberValue(payload?.['currentPage']) ?? 0,
    totalPages: numberValue(data?.['totalPages']) ?? numberValue(payload?.['totalPages']) ?? 0,
    totalItems:
      numberValue(data?.['totalItems']) ?? numberValue(payload?.['totalItems']) ?? rows.length
  };
}

function mapAuditRow(row: Record<string, unknown>): SummaryTableRow {
  const activity =
    stringValue(row['activity']) ||
    stringValue(row['action']) ||
    stringValue(row['event']) ||
    stringValue(row['description']) ||
    stringValue(row['message']) ||
    'Audit entry';

  const actor =
    [stringValue(row['firstName']), stringValue(row['lastName'])]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    stringValue(row['actor']) ||
    stringValue(row['username']) ||
    stringValue(row['userName']) ||
    stringValue(row['email']) ||
    'System';

  const type =
    titleCase(
      (
        stringValue(row['flag']) ||
        stringValue(row['type']) ||
        stringValue(row['auditType']) ||
        stringValue(row['category']) ||
        stringValue(row['module']) ||
        'Activity'
      ).replace(/_/g, ' ')
    ) || 'Activity';

  const createdAt =
    stringValue(row['requestTime']) ||
    stringValue(row['createdDate']) ||
    stringValue(row['createdAt']) ||
    stringValue(row['dateCreated']) ||
    stringValue(row['timestamp']) ||
    '';

  const statusText = resolveAuditStatus(row);

  return {
    initials: initialsFromName(actor),
    primaryText: activity,
    secondaryText: stringValue(row['request']) || stringValue(row['ipAddress']) || actor,
    statusText: `${type} · ${statusText}`,
    statusClass: auditStatusTone(statusText),
    amountText: actor,
    metaText: formatDisplayDate(createdAt),
    route: resolveAuditRoute(row)
  };
}

function mapAuditDetail(row: Record<string, unknown>): AuditDetailView {
  const statusText = resolveAuditStatus(row);

  return {
    id: stringValue(row['id']) || '—',
    email: stringValue(row['email']) || 'No email provided',
    event: stringValue(row['event']) || 'Audit event',
    flag:
      titleCase(
        (
          stringValue(row['flag']) ||
          stringValue(row['type']) ||
          'Activity'
        ).replace(/_/g, ' ')
      ) || 'Activity',
    request: stringValue(row['request']) || 'No request details available',
    ipAddress: stringValue(row['ipAddress']) || '—',
    merchantId: stringValue(row['merchantId']) || '—',
    statusText,
    statusTone: auditStatusTone(statusText),
    requestTime: formatDisplayDate(stringValue(row['requestTime']) || stringValue(row['createdDate']) || '')
  };
}

function extractAuditDetailRecord(response: unknown): Record<string, unknown> | null {
  const root = asRecord(response);
  if (!root) {
    return null;
  }

  if (numberValue(root['id']) !== null || stringValue(root['event']) || stringValue(root['request'])) {
    return root;
  }

  const data = asRecord(root['data']);
  if (data && (numberValue(data['id']) !== null || stringValue(data['event']) || stringValue(data['request']))) {
    return data;
  }

  const nested = asRecord(data?.['data']);
  if (nested && (numberValue(nested['id']) !== null || stringValue(nested['event']) || stringValue(nested['request']))) {
    return nested;
  }

  return null;
}

function resolveAuditStatus(row: Record<string, unknown>): string {
  const rawStatus = numberValue(row['status']);
  if (rawStatus === 1) {
    return 'Successful';
  }
  if (rawStatus === 0) {
    return 'Failed';
  }

  const fallback = stringValue(row['status']);
  return fallback ? titleCase(fallback.replace(/_/g, ' ')) : 'Unknown';
}

function auditStatusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('success')) {
    return 'succeeded';
  }
  if (normalized.includes('fail')) {
    return 'failed';
  }
  return 'pending';
}

function resolveAuditRoute(row: Record<string, unknown>): string | undefined {
  const id = stringValue(row['id']);
  return id ? `/audit/${encodeURIComponent(id)}` : undefined;
}
