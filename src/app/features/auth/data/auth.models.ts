export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  code: string;
  description: string;
  data: AuthSession;
}

/** Body for `PUT /user/changepassword`. */
export interface ChangePasswordRequest {
  password: string;
  previousPassword: string;
}

/** Mirrors typical API envelopes; adjust if the backend differs. */
export interface ChangePasswordResponse {
  code: string;
  description: string;
  data?: unknown;
}

export interface ActivatePasswordRequest {
  uniqueId?: string;
  resetToken: string;
  password: string;
}

export interface ActivatePasswordResponse {
  code: string;
  description: string;
  data?: unknown;
}

export interface AuthSession {
  accessToken: string;
  phone: string;
  email: string;
  lastName: string;
  firstName: string;
  lastLogin: string;
  tokenExpiry: number;
  expireIn: number;
  userId: number;
  status: string;
  uniqueId: string;
  permissions: string[];
  userCategory: string;
  role?: string;
}
