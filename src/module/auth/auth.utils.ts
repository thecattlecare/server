import crypto from 'crypto';
import { ApiError } from '../../utils/api-error';
import { IAuthPayload, IRequestAuthContext, ISessionDeviceInfo, UserRole } from './auth.types';

const ACCESS_TOKEN_SECRET = process.env.AUTH_ACCESS_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || 'access-secret';
const REFRESH_TOKEN_SECRET = process.env.AUTH_REFRESH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || 'refresh-secret';

const base64UrlEncode = (value: Buffer | string) => {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
};

const sign = (payload: string, secret: string) => {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
};

export const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${derived}`;
};

export const verifyPassword = (password: string, stored: string) => {
  const [salt, derived] = stored.split(':');
  if (!salt || !derived) {
    return false;
  }

  const current = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(current, 'hex'), Buffer.from(derived, 'hex'));
};

const createJwtLikeToken = (payload: Omit<IAuthPayload, 'iat' | 'exp'>, ttlSeconds: number, secret: string) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenPayload: IAuthPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

const verifyJwtLikeToken = (token: string, secret: string): IAuthPayload => {
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw ApiError.UNAUTHORIZED('Invalid token');
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw ApiError.UNAUTHORIZED('Invalid token');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as IAuthPayload;
  if (!payload.exp || Math.floor(Date.now() / 1000) >= payload.exp) {
    throw ApiError.UNAUTHORIZED('Token expired');
  }

  return payload;
};

export const createAccessToken = (payload: Omit<IAuthPayload, 'iat' | 'exp' | 'tokenType'>) => {
  return createJwtLikeToken({ ...payload, tokenType: 'access' }, 60 * 5, ACCESS_TOKEN_SECRET);
};

export const createRefreshToken = (payload: Omit<IAuthPayload, 'iat' | 'exp' | 'tokenType'>) => {
  return createJwtLikeToken({ ...payload, tokenType: 'refresh' }, 60 * 60 * 24 * 3, REFRESH_TOKEN_SECRET);
};

export const verifyAccessToken = (token: string) => {
  const payload = verifyJwtLikeToken(token, ACCESS_TOKEN_SECRET);
  if (payload.tokenType !== 'access') {
    throw ApiError.UNAUTHORIZED('Invalid token');
  }
  return payload;
};

export const verifyRefreshToken = (token: string) => {
  const payload = verifyJwtLikeToken(token, REFRESH_TOKEN_SECRET);
  if (payload.tokenType !== 'refresh') {
    throw ApiError.UNAUTHORIZED('Invalid token');
  }
  return payload;
};

export const parseDeviceInfo = (
  useragentObj?: any,
  ipAddress?: string,
  headers?: any // Pass the full request headers
): ISessionDeviceInfo => {

  // Default values
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  let ua = '';
  let isBot = false;
  let botName = '';

  if (useragentObj && typeof useragentObj === 'object') {
    ua = useragentObj.source || '';
    browser = useragentObj.browser || 'Unknown';

    // ===== BOT DETECTION =====
    isBot = useragentObj.isBot ?? false;
    if (isBot && useragentObj.botName) {
      botName = useragentObj.botName;
    }

    // ===== IMPROVED WINDOWS DETECTION =====
    // Priority 1: Check Client Hints for platform version (MOST RELIABLE)
    const clientHints = useragentObj.clientHints || headers;

    if (clientHints?.platformVersion) {
      // Windows 11 returns "14.0.0" or higher (NT 10.0 build 22000+)
      // Windows 10 returns "10.0.0" or "1.0.0" for older builds
      const platformVersion = clientHints.platformVersion;

      if (clientHints.platform === 'Windows') {
        if (platformVersion === '14.0.0' || parseInt(platformVersion) >= 14) {
          os = 'Windows 11';
        } else if (platformVersion === '10.0.0' || platformVersion === '1.0.0') {
          os = 'Windows 10';
        } else {
          os = `Windows (${platformVersion})`;
        }
      } else {
        os = useragentObj.os || 'Unknown';
      }
    }
    // Priority 2: Check specific Windows 11 indicators in User-Agent
    else if (ua && ua.includes('Windows NT 10.0')) {
      // Windows 11 specific keywords (rare but possible)
      if (ua.includes('Windows 11') ||
        ua.includes('Win64; x64; rv:') || // Firefox on Win11
        (ua.includes('Chrome/') && !ua.includes('Edg/') && isWindows11Build(ua))) {
        os = 'Windows 11';
      }
      // Check for Windows 10 specific indicators
      else if (ua.includes('Windows 10') || ua.includes('Win64; x64; rv:102')) {
        os = 'Windows 10';
      }
      else {
        // Default to Windows 10 if we can't determine
        os = 'Windows 10 or 11';
      }
    }
    // Priority 3: Use standard parsing for other OS
    else {
      os = useragentObj.os || 'Unknown';
    }

    device = useragentObj.isMobile ? 'Mobile' :
      useragentObj.isTablet ? 'Tablet' : 'Desktop';
  }

  return {
    ipAddress,
    userAgent: ua,
    browser,
    os,
    device,
    isBot,
    botName,
  };
};

// Helper function to detect Windows 11 based on build number patterns
function isWindows11Build(ua: string): boolean {
  // This is complex because build numbers aren't in UA strings
  // Better to rely on Client Hints
  return false; // Not reliable via UA alone
}

export const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const TOKEN_LIFETIMES = {
  ACCESS_SECONDS: 60 * 5,
  REFRESH_SECONDS: 60 * 60 * 24 * 3,
} as const;

export const buildAuthContext = (payload: IAuthPayload): IRequestAuthContext => ({
  userId: payload.sub,
  sessionId: payload.sid,
  role: payload.role,
  email: payload.email,
});

export const normalizeRole = (role?: string): UserRole => {
  return role === 'admin' ? 'admin' : 'user';
};
