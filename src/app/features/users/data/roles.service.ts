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
  statusClassForLabel,
  titleCase
} from '../../../shared/utils/format.utils';
import { normalizeApiPageIndex } from '../../../shared/utils/pagination.utils';
import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import {
  CreateRolePayload,
  PermissionListItem,
  PermissionListResponse,
  PermissionOption,
  RoleOption,
  RoleStatData,
  UserPageResult,
  UserQueryParams
} from './users.models';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly roleBaseUrl = `${environment.apiBaseUrl}/role`;
  private readonly rolePageUrl = `${this.roleBaseUrl}/page`;
  private readonly roleListUrl = `${this.roleBaseUrl}/list`;
  private readonly permissionListUrl = `${environment.apiBaseUrl}/permission/type`;
  private readonly addRoleUrl = `${this.roleBaseUrl}/roleperm`;

  /** `GET …/role/stat` — aggregate role counts (Bearer from interceptor). */
  getRoleStat(): Observable<RoleStatData> {
    return this.http.get<unknown>(`${this.roleBaseUrl}/stat`).pipe(map(parseRoleStatResponse));
  }

  getRoles(query: UserQueryParams): Observable<UserPageResult> {
    let params = new HttpParams()
      .set('page', String(query.page + 1))
      .set('size', String(query.size));

    const search = query.searchParam?.trim();
    if (search) {
      params = params.set('searchParam', search);
    }

    return this.http.get<unknown>(this.rolePageUrl, { params }).pipe(
      map((response) => {
        const page = extractPageEnvelope(response);
        return {
          items: page.items.map(mapRoleRow),
          currentPage: page.currentPage,
          totalPages: page.totalPages,
          totalItems: page.totalItems
        };
      })
    );
  }

  getRoleOptions(): Observable<RoleOption[]> {
    return this.http.get<unknown>(this.roleListUrl).pipe(
      map((response) => {
        const roles = extractRoleList(response);
        return roles
          .map(mapRoleOption)
          .filter((role): role is RoleOption => role.id > 0)
          .sort((left, right) => left.name.localeCompare(right.name));
      })
    );
  }

  getPermissions(): Observable<PermissionOption[]> {
    return this.http.get<PermissionListResponse>(this.permissionListUrl).pipe(
      map((response) => response.data.map(mapPermissionOption))
    );
  }

  createRole(payload: CreateRolePayload): Observable<unknown> {
    return this.http.post(this.addRoleUrl, payload);
  }
}

function parseRoleStatResponse(response: unknown): RoleStatData {
  const root = asRecord(response);
  const data = asRecord(root?.['data']) ?? root;
  return {
    total: numberValue(data?.['total']) ?? 0,
    active: numberValue(data?.['active']) ?? 0,
    inactive: numberValue(data?.['inactive']) ?? 0
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
      data?.['roles'] ??
      payload?.['items'] ??
      payload?.['roles']
  );

  return {
    items: rows,
    currentPage: normalizeApiPageIndex(numberValue(data?.['currentPage']) ?? numberValue(payload?.['currentPage'])),
    totalPages: numberValue(data?.['totalPages']) ?? numberValue(payload?.['totalPages']) ?? 0,
    totalItems:
      numberValue(data?.['totalItems']) ?? numberValue(payload?.['totalItems']) ?? rows.length
  };
}

function extractRoleList(response: unknown): Record<string, unknown>[] {
  const payload = asRecord(response);
  const data = asRecord(payload?.['data']);

  return asRecordArray(
    payload?.['data'] ??
      data?.['data'] ??
      data?.['items'] ??
      data?.['roles'] ??
      payload?.['items'] ??
      payload?.['roles']
  );
}

function mapRoleRow(row: Record<string, unknown>): SummaryTableRow {
  const name =
    stringValue(row['roleName']) ||
    stringValue(row['name']) ||
    stringValue(row['role']) ||
    stringValue(row['title']) ||
    'Unknown role';

  const status =
    titleCase(
      (
        stringValue(row['status']) ||
        stringValue(row['roleStatus']) ||
        stringValue(row['state']) ||
        'Active'
      ).replace(/_/g, ' ')
    ) || 'Active';

  const createdAt =
    stringValue(row['createdDate']) ||
    stringValue(row['createdAt']) ||
    stringValue(row['dateCreated']) ||
    '';

  return {
    initials: initialsFromName(name),
    primaryText: name,
    secondaryText:
      stringValue(row['description']) ||
      stringValue(row['roleDescription']) ||
      stringValue(row['code']) ||
      'Role record',
    statusText: status,
    statusClass: statusClassForLabel(status),
    metaText: formatDisplayDate(createdAt)
  };
}

function mapRoleOption(row: Record<string, unknown>): RoleOption {
  const name =
    stringValue(row['roleName']) ||
    stringValue(row['name']) ||
    stringValue(row['role']) ||
    stringValue(row['title']) ||
    'Unknown role';

  const id =
    numberValue(row['id']) ??
    numberValue(row['roleId']) ??
    numberValue(row['roleID']) ??
    0;

  return {
    id,
    name,
    description:
      stringValue(row['description']) ||
      stringValue(row['roleDescription']) ||
      stringValue(row['code']) ||
      'Role record'
  };
}

function mapPermissionOption(row: PermissionListItem): PermissionOption {
  const rawName = row.name?.trim() || `Permission ${row.id}`.trim();
  const menuName = row.menuName?.trim() || '';
  const status = row.status?.trim() || '';

  return {
    id: row.id,
    menuName,
    name: humanizePermissionName(rawName),
    description:
      [
        menuName ? `Menu: ${titleCase(menuName)}` : '',
        status ? `Status: ${status === '1' ? 'Active' : status}` : '',
        row.url?.trim() ? `URL: ${row.url.trim()}` : ''
      ]
        .filter(Boolean)
        .join(' • ') || 'No description provided'
  };
}

function humanizePermissionName(value: string): string {
  return value
    .replace(/^ROLE_/i, '')
    .replace(/[_/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => titleCase(part))
    .join(' ');
}
