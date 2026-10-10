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
  initialsFromName,
  formatDisplayDate,
  titleCase
} from '../../../shared/utils/format.utils';
import { normalizeApiPageIndex } from '../../../shared/utils/pagination.utils';
import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import {
  CreateUserPayload,
  EnableDisableUserPayload,
  UnlockUserPayload,
  UserDetailResponse,
  UserDetailView,
  UserListResponse,
  UserPageResult,
  UserQueryParams,
  UserStatData
} from './users.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly userPageUrl = `${environment.apiBaseUrl}/user/page`;
  private readonly userBaseUrl = `${environment.apiBaseUrl}/user`;
  private readonly addUserUrl = this.userBaseUrl;

  /** `GET …/user/stat` — aggregate user counts (Bearer from interceptor). */
  getUserStat(): Observable<UserStatData> {
    return this.http.get<unknown>(`${this.userBaseUrl}/stat`).pipe(map(parseUserStatResponse));
  }

  getUsers(query: UserQueryParams): Observable<UserPageResult> {
    let params = new HttpParams()
      .set('page', String(query.page + 1))
      .set('size', String(query.size));

    const search = query.searchParam?.trim();
    if (search) {
      params = params.set('searchParam', search);
    }

    return this.http.get<UserListResponse>(this.userPageUrl, { params }).pipe(
      map((response) => {
        const page = extractPageEnvelope(response);
        const rows = page.items.map(mapUserRow);

        return {
          items: rows,
          currentPage: page.currentPage,
          totalPages: page.totalPages,
          totalItems: page.totalItems
        };
      })
    );
  }

  getUser(uniqueId: string): Observable<UserDetailView> {
    const id = uniqueId.trim();

    return this.http.get<UserDetailResponse | unknown>(`${this.userBaseUrl}/${encodeURIComponent(id)}`).pipe(
      map((response) => {
        const row = extractUserDetailRecord(response);
        if (!row) {
          throw new Error('User details are not available in the response.');
        }
        return mapUserDetailView(row);
      })
    );
  }

  createUser(payload: CreateUserPayload): Observable<unknown> {
    return this.http.post(this.addUserUrl, payload);
  }

  unlockUser(payload: UnlockUserPayload): Observable<unknown> {
    return this.http.put(`${this.userBaseUrl}/unlock`, payload, {
      headers: { accept: '*/*' }
    });
  }

  setUserEnabled(payload: EnableDisableUserPayload): Observable<unknown> {
    return this.http.put(`${this.userBaseUrl}/enabledisenable`, payload, {
      headers: { accept: '*/*' }
    });
  }
}

function parseUserStatResponse(response: unknown): UserStatData {
  const root = asRecord(response);
  const data = asRecord(root?.['data']) ?? root;
  return {
    totalUser: numberValue(data?.['totalUser']) ?? numberValue(data?.['total']) ?? 0,
    activeUser: numberValue(data?.['activeUser']) ?? numberValue(data?.['active']) ?? 0,
    inactiveUsers:
      numberValue(data?.['inactiveUsers']) ??
      numberValue(data?.['inactiveUser']) ??
      numberValue(data?.['inactive']) ??
      0,
    deactivatedUsers:
      numberValue(data?.['deactivatedUsers']) ??
      numberValue(data?.['deactivatedUser']) ??
      numberValue(data?.['deactivated']) ??
      0
  };
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
      data?.['users'] ??
      payload?.['items'] ??
      payload?.['users']
  );

  return {
    items: rows,
    currentPage: normalizeApiPageIndex(numberValue(data?.['currentPage']) ?? numberValue(payload?.['currentPage'])),
    totalPages: numberValue(data?.['totalPages']) ?? numberValue(payload?.['totalPages']) ?? 0,
    totalItems:
      numberValue(data?.['totalItems']) ?? numberValue(payload?.['totalItems']) ?? rows.length
  };
}

function mapUserRow(row: Record<string, unknown>): SummaryTableRow {
  const name =
    [stringValue(row['firstName']), stringValue(row['lastName'])]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    stringValue(row['fullName']) ||
    stringValue(row['name']) ||
    stringValue(row['username']) ||
    stringValue(row['email']) ||
    'Unknown user';

  const email =
    stringValue(row['email']) ||
    stringValue(row['userName']) ||
    stringValue(row['username']) ||
    'No email provided';

  const statusLabel = resolveUserStatus(row);
  const createdAt =
    stringValue(row['createdDate']) ||
    stringValue(row['createdAt']) ||
    stringValue(row['dateCreated']) ||
    stringValue(row['lastLogin']) ||
    '';

  return {
    initials: initialsFromName(name),
    primaryText: name,
    secondaryText: email,
    statusText: statusLabel,
    statusClass: userStatusTone(statusLabel),
    amountText: titleCase(
      stringValue(row['role']) ||
        stringValue(row['userCategory']) ||
        stringValue(row['userType']) ||
        'User'
    ),
    metaText: formatDisplayDate(createdAt),
    route: resolveUserRoute(row)
  };
}

function mapUserDetailView(row: Record<string, unknown>): UserDetailView {
  const fullName =
    [stringValue(row['firstName']), stringValue(row['lastName'])].filter(Boolean).join(' ').trim() ||
    stringValue(row['username']) ||
    stringValue(row['email']) ||
    'Unknown user';
  const statusText = resolveUserStatus(row);

  return {
    id: stringValue(row['id']) || '—',
    uniqueId: stringValue(row['uniqueId']) || '—',
    fullName,
    email: stringValue(row['email']) || 'No email provided',
    phone: stringValue(row['phone']) || 'No phone provided',
    merchantId: stringValue(row['merchantId']) || '—',
    userCategory: titleCase(stringValue(row['userCategory']) || '—'),
    statusText,
    statusTone: userStatusTone(statusText),
    loginStatusText: booleanText(row['loginStatus'], 'Logged in', 'Logged out'),
    username: stringValue(row['username']) || '—',
    roleId: stringValue(row['roleId']) || '—',
    loginAttempts: stringValue(row['loginAttempts']) || '0',
    lastLogin: formatDetailDate(row['lastLogin']),
    failedLoginDate: formatDetailDate(row['failedLoginDate']),
    lockedDate: formatDetailDate(row['lockedDate']),
    passwordChangedOn: formatDetailDate(row['passwordChangedOn']),
    createdDate: formatDetailDate(row['createdDate']),
    updatedDate: formatDetailDate(row['updatedDate']),
    createdBy: stringValue(row['createdBy']) || '—',
    updatedBy: stringValue(row['updatedBy']) || '—',
    twoFactorText: booleanText(row['twoFactor'], 'Enabled', 'Disabled')
  };
}

function resolveUserStatus(row: Record<string, unknown>): string {
  const raw =
    stringValue(row['status']) ||
    stringValue(row['userStatus']) ||
    stringValue(row['accountStatus']) ||
    'Active';

  const normalized = raw.toLowerCase();
  if (
    normalized === '02' ||
    normalized.includes('inactive') ||
    normalized.includes('disable') ||
    normalized.includes('suspend') ||
    normalized.includes('block')
  ) {
    return 'Inactive';
  }
  if (normalized === '00' || normalized.includes('active') || normalized.includes('enable')) {
    return 'Active';
  }
  if (normalized === '01' || normalized.includes('pending')) {
    return 'Pending';
  }
  return titleCase(raw.replace(/_/g, ' '));
}

function userStatusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('inactive') || normalized.includes('suspend') || normalized.includes('block')) {
    return 'failed';
  }
  if (normalized.includes('active')) {
    return 'succeeded';
  }
  if (normalized.includes('pending')) {
    return 'pending';
  }
  return 'pending';
}

function extractUserDetailRecord(response: unknown): Record<string, unknown> | null {
  const root = asRecord(response);
  if (!root) {
    return null;
  }

  if (stringValue(root['email']) || stringValue(root['firstName']) || stringValue(root['uniqueId'])) {
    return root;
  }

  const data = asRecord(root['data']);
  if (data && (stringValue(data['email']) || stringValue(data['firstName']) || stringValue(data['uniqueId']))) {
    return data;
  }

  const nested = asRecord(data?.['data']);
  if (nested && (stringValue(nested['email']) || stringValue(nested['firstName']) || stringValue(nested['uniqueId']))) {
    return nested;
  }

  return null;
}

function resolveUserRoute(row: Record<string, unknown>): string | undefined {
  const id =
    stringValue(row['uniqueId']) ||
    stringValue(row['userId']) ||
    stringValue(row['id']);

  return id ? `/teams/users/${encodeURIComponent(id)}` : undefined;
}

function formatDetailDate(value: unknown): string {
  const raw = stringValue(value);
  return raw ? formatDisplayDate(raw) : '—';
}

function booleanText(value: unknown, truthy: string, falsy: string): string {
  return typeof value === 'boolean' ? (value ? truthy : falsy) : falsy;
}
