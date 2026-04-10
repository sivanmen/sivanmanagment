export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  MAINTENANCE = 'MAINTENANCE',
  OWNER = 'OWNER',
  VIP_STAR = 'VIP_STAR',
  AFFILIATE = 'AFFILIATE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  preferredLocale: string;
  timezone: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLocale?: string;
  timezone?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthenticatedUser extends User {
  accessToken: string;
  refreshToken: string;
}
