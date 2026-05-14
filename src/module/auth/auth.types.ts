import { Types } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface IAuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface IAuthSession {
  _id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  current?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface ICreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface IAuthPayload {
  sub: string;
  sid: string;
  role: UserRole;
  email: string;
  tokenType: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface IRequestAuthContext {
  userId: string;
  sessionId: string;
  role: UserRole;
  email: string;
}

export interface ITokenPairResponse {
  user: IAuthUser;
  session: IAuthSession;
  tokens: IAuthTokens;
}

export interface ISessionDeviceInfo {
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
}

export interface IJwtLikePayload extends Record<string, unknown> {
  sub: string;
  sid: string;
  role: UserRole;
  email: string;
  tokenType: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface IAuthCookieData {
  refreshToken: string;
}

export interface ISessionListResponse {
  sessions: IAuthSession[];
  currentSessionId: string | null;
}

export interface IAuthMeResponse extends IAuthUser {
  sessionId: string | null;
}

export type MaybeObjectId = string | Types.ObjectId;
