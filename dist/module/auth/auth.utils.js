"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRole = exports.buildAuthContext = exports.TOKEN_LIFETIMES = exports.getBearerToken = exports.parseDeviceInfo = exports.verifyRefreshToken = exports.verifyAccessToken = exports.createRefreshToken = exports.createAccessToken = exports.verifyPassword = exports.hashPassword = exports.hashToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const api_error_1 = require("../../utils/api-error");
const ACCESS_TOKEN_SECRET = process.env.AUTH_ACCESS_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || 'access-secret';
const REFRESH_TOKEN_SECRET = process.env.AUTH_REFRESH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || 'refresh-secret';
const base64UrlEncode = (value) => {
    return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};
const base64UrlDecode = (value) => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(normalized + padding, 'base64').toString('utf8');
};
const sign = (payload, secret) => {
    return crypto_1.default.createHmac('sha256', secret).update(payload).digest('base64url');
};
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
const hashPassword = (password) => {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const derived = crypto_1.default.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
    return `${salt}:${derived}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = (password, stored) => {
    const [salt, derived] = stored.split(':');
    if (!salt || !derived) {
        return false;
    }
    const current = crypto_1.default.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(current, 'hex'), Buffer.from(derived, 'hex'));
};
exports.verifyPassword = verifyPassword;
const createJwtLikeToken = (payload, ttlSeconds, secret) => {
    const issuedAt = Math.floor(Date.now() / 1000);
    const tokenPayload = {
        ...payload,
        iat: issuedAt,
        exp: issuedAt + ttlSeconds,
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = sign(encodedPayload, secret);
    return `${encodedPayload}.${signature}`;
};
const verifyJwtLikeToken = (token, secret) => {
    const parts = token.split('.');
    if (parts.length !== 2) {
        throw api_error_1.ApiError.UNAUTHORIZED('Invalid token');
    }
    const [encodedPayload, signature] = parts;
    const expectedSignature = sign(encodedPayload, secret);
    if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw api_error_1.ApiError.UNAUTHORIZED('Invalid token');
    }
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!payload.exp || Math.floor(Date.now() / 1000) >= payload.exp) {
        throw api_error_1.ApiError.UNAUTHORIZED('Token expired');
    }
    return payload;
};
const createAccessToken = (payload) => {
    return createJwtLikeToken({ ...payload, tokenType: 'access' }, 60 * 5, ACCESS_TOKEN_SECRET);
};
exports.createAccessToken = createAccessToken;
const createRefreshToken = (payload) => {
    return createJwtLikeToken({ ...payload, tokenType: 'refresh' }, 60 * 60 * 24 * 3, REFRESH_TOKEN_SECRET);
};
exports.createRefreshToken = createRefreshToken;
const verifyAccessToken = (token) => {
    const payload = verifyJwtLikeToken(token, ACCESS_TOKEN_SECRET);
    if (payload.tokenType !== 'access') {
        throw api_error_1.ApiError.UNAUTHORIZED('Invalid token');
    }
    return payload;
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    const payload = verifyJwtLikeToken(token, REFRESH_TOKEN_SECRET);
    if (payload.tokenType !== 'refresh') {
        throw api_error_1.ApiError.UNAUTHORIZED('Invalid token');
    }
    return payload;
};
exports.verifyRefreshToken = verifyRefreshToken;
const parseDeviceInfo = (userAgent, ipAddress) => {
    const ua = userAgent || '';
    const normalized = ua.toLowerCase();
    let browser = 'Unknown';
    if (normalized.includes('edg/'))
        browser = 'Edge';
    else if (normalized.includes('chrome/'))
        browser = 'Chrome';
    else if (normalized.includes('firefox/'))
        browser = 'Firefox';
    else if (normalized.includes('safari/') && !normalized.includes('chrome/'))
        browser = 'Safari';
    let os = 'Unknown';
    if (normalized.includes('windows'))
        os = 'Windows';
    else if (normalized.includes('mac os'))
        os = 'macOS';
    else if (normalized.includes('android'))
        os = 'Android';
    else if (normalized.includes('iphone') || normalized.includes('ipad') || normalized.includes('ios'))
        os = 'iOS';
    else if (normalized.includes('linux'))
        os = 'Linux';
    const device = normalized.includes('mobile') ? 'Mobile' : 'Desktop';
    return {
        ipAddress,
        userAgent: ua,
        browser,
        os,
        device,
    };
};
exports.parseDeviceInfo = parseDeviceInfo;
const getBearerToken = (authorizationHeader) => {
    if (!authorizationHeader) {
        return null;
    }
    const [scheme, token] = authorizationHeader.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
        return null;
    }
    return token;
};
exports.getBearerToken = getBearerToken;
exports.TOKEN_LIFETIMES = {
    ACCESS_SECONDS: 60 * 5,
    REFRESH_SECONDS: 60 * 60 * 24 * 3,
};
const buildAuthContext = (payload) => ({
    userId: payload.sub,
    sessionId: payload.sid,
    role: payload.role,
    email: payload.email,
});
exports.buildAuthContext = buildAuthContext;
const normalizeRole = (role) => {
    return role === 'admin' ? 'admin' : 'user';
};
exports.normalizeRole = normalizeRole;
