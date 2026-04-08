import { SummaryTableRow } from '../../../shared/components/payment-transactions-table/payment-transactions-table.component';

export interface UserQueryParams {
  searchParam?: string;
  page: number;
  size: number;
}

export interface UserPageResult {
  items: SummaryTableRow[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/** Payload under `data` from `GET …/role/stat`. */
export interface RoleStatData {
  total: number;
  active: number;
  inactive: number;
}

/** Payload under `data` from `GET …/user/stat`. */
export interface UserStatData {
  totalUser: number;
  activeUser: number;
  inactiveUsers: number;
  deactivatedUsers: number;
}

export interface UserListItem {
  id: number;
  uniqueId: string | null;
  loginAttempts: number | null;
  failedLoginDate: string | null;
  lastLogin: string | null;
  lockedDate: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  passwordChangedOn: string | null;
  loginStatus: boolean | null;
  email: string | null;
  phone: string | null;
  merchantId: string | null;
  userCategory: string | null;
  resetToken: string | null;
  resetTokenExpirationDate: string | null;
  createdDate: string | null;
  updatedDate: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  status: string | null;
  twoFactor: boolean | null;
  roleId: number | null;
}

export interface UserListPageData {
  data: UserListItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface UserListResponse {
  code: string;
  description: string;
  data: UserListPageData;
}

export interface UserDetailResponse {
  code: string;
  description: string;
  data: UserListItem;
}

export interface UserDetailView {
  id: string;
  uniqueId: string;
  fullName: string;
  email: string;
  phone: string;
  merchantId: string;
  userCategory: string;
  statusText: string;
  statusTone: string;
  loginStatusText: string;
  username: string;
  roleId: string;
  loginAttempts: string;
  lastLogin: string;
  failedLoginDate: string;
  lockedDate: string;
  passwordChangedOn: string;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
  twoFactorText: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: number;
}

export interface RoleOption {
  id: number;
  name: string;
  description: string;
}

export interface RolePermissionItem {
  id: number;
  roleId: number;
  permissionId: number;
  createdDate: string;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: RolePermissionItem[];
}

export interface PermissionOption {
  id: number;
  name: string;
  description: string;
  menuName: string;
}

export interface PermissionListItem {
  id: number;
  name: string;
  menuName: string;
  url: string;
  permissionType: string;
  createdDate: string;
  updatedDate: string;
  status: string;
}

export interface PermissionListResponse {
  code: string;
  description: string;
  data: PermissionListItem[];
}
