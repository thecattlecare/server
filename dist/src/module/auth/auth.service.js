"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const mongoose_1 = require("mongoose");
const api_error_1 = require("../../utils/api-error");
const auth_model_1 = require("./auth.model");
const session_model_1 = require("./session.model");
const auth_utils_1 = require("./auth.utils");
const mapUser = (user) => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
});
const mapSession = (session) => ({
    _id: session._id.toString(),
    userId: session.userId.toString(),
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    browser: session.browser,
    os: session.os,
    device: session.device,
    current: false,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
});
class AuthService {
    async findUserByEmail(email) {
        return auth_model_1.User.findOne({ email: email.toLowerCase().trim(), isActive: true }).select('+passwordHash');
    }
    buildDeviceInfo(req) {
        return (0, auth_utils_1.parseDeviceInfo)(req.headers['user-agent'], req.ip);
    }
    async createSessionForUser(user, req) {
        const deviceInfo = this.buildDeviceInfo(req);
        const session = await session_model_1.AuthSession.create({
            userId: user._id,
            refreshTokenHash: (0, auth_utils_1.hashToken)(`${Date.now()}-${Math.random()}`),
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            device: deviceInfo.device,
            isRevoked: false,
            expiresAt: new Date(Date.now() + auth_utils_1.TOKEN_LIFETIMES.REFRESH_SECONDS * 1000),
            lastUsedAt: new Date(),
        });
        const accessToken = (0, auth_utils_1.createAccessToken)({
            sub: user._id.toString(),
            sid: session._id.toString(),
            role: user.role,
            email: user.email,
        });
        const refreshToken = (0, auth_utils_1.createRefreshToken)({
            sub: user._id.toString(),
            sid: session._id.toString(),
            role: user.role,
            email: user.email,
        });
        session.refreshTokenHash = (0, auth_utils_1.hashToken)(refreshToken);
        session.expiresAt = new Date(Date.now() + auth_utils_1.TOKEN_LIFETIMES.REFRESH_SECONDS * 1000);
        session.lastUsedAt = new Date();
        await session.save();
        return { session, accessToken, refreshToken };
    }
    async login(payload, req) {
        const user = await this.findUserByEmail(payload.email);
        if (!user || !user.passwordHash) {
            throw api_error_1.ApiError.UNAUTHORIZED('Invalid email or password');
        }
        const passwordOk = (0, auth_utils_1.verifyPassword)(payload.password, user.passwordHash);
        if (!passwordOk) {
            throw api_error_1.ApiError.UNAUTHORIZED('Invalid email or password');
        }
        const { session, accessToken, refreshToken } = await this.createSessionForUser(user, req);
        return {
            user: mapUser(user),
            session: { ...mapSession(session), current: true },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: auth_utils_1.TOKEN_LIFETIMES.ACCESS_SECONDS,
                refreshExpiresIn: auth_utils_1.TOKEN_LIFETIMES.REFRESH_SECONDS,
            },
        };
    }
    async refresh(refreshToken, req) {
        const payload = (0, auth_utils_1.verifyRefreshToken)(refreshToken);
        const session = await session_model_1.AuthSession.findById(payload.sid).populate('userId').select('+refreshTokenHash');
        if (!session || !session.refreshTokenHash) {
            throw api_error_1.ApiError.UNAUTHORIZED('Session expired');
        }
        if (session.isRevoked || session.expiresAt.getTime() <= Date.now()) {
            throw api_error_1.ApiError.UNAUTHORIZED('Session expired');
        }
        if (session.refreshTokenHash !== (0, auth_utils_1.hashToken)(refreshToken)) {
            throw api_error_1.ApiError.UNAUTHORIZED('Session expired');
        }
        const user = session.userId;
        if (!user || !user.isActive) {
            throw api_error_1.ApiError.UNAUTHORIZED('Session expired');
        }
        const newAccessToken = (0, auth_utils_1.createAccessToken)({
            sub: user._id.toString(),
            sid: session._id.toString(),
            role: user.role,
            email: user.email,
        });
        const newRefreshToken = (0, auth_utils_1.createRefreshToken)({
            sub: user._id.toString(),
            sid: session._id.toString(),
            role: user.role,
            email: user.email,
        });
        session.refreshTokenHash = (0, auth_utils_1.hashToken)(newRefreshToken);
        session.expiresAt = new Date(Date.now() + auth_utils_1.TOKEN_LIFETIMES.REFRESH_SECONDS * 1000);
        session.lastUsedAt = new Date();
        const deviceInfo = this.buildDeviceInfo(req);
        session.ipAddress = deviceInfo.ipAddress;
        session.userAgent = deviceInfo.userAgent;
        session.browser = deviceInfo.browser;
        session.os = deviceInfo.os;
        session.device = deviceInfo.device;
        await session.save();
        return {
            user: mapUser(user),
            session: { ...mapSession(session), current: true },
            tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: auth_utils_1.TOKEN_LIFETIMES.ACCESS_SECONDS,
                refreshExpiresIn: auth_utils_1.TOKEN_LIFETIMES.REFRESH_SECONDS,
            },
        };
    }
    async me(userId, sessionId) {
        const user = await auth_model_1.User.findById(userId);
        if (!user || !user.isActive) {
            throw api_error_1.ApiError.UNAUTHORIZED('User not found');
        }
        return {
            ...mapUser(user),
            sessionId,
        };
    }
    async listSessions(userId, currentSessionId) {
        const sessions = await session_model_1.AuthSession.find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .lean();
        return {
            sessions: sessions.map((session) => ({
                _id: session._id.toString(),
                userId: session.userId.toString(),
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                browser: session.browser,
                os: session.os,
                device: session.device,
                current: currentSessionId ? session._id.toString() === currentSessionId : false,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                lastUsedAt: session.lastUsedAt,
                expiresAt: session.expiresAt,
                revokedAt: session.revokedAt,
            })),
            currentSessionId: currentSessionId || null,
        };
    }
    async revokeSession(sessionId, requesterUserId, requesterRole) {
        const session = await session_model_1.AuthSession.findById(sessionId);
        if (!session) {
            throw api_error_1.ApiError.NOT_FOUND('Session not found');
        }
        if (requesterRole !== 'admin' && session.userId.toString() !== requesterUserId) {
            throw api_error_1.ApiError.FORBIDDEN('You can only revoke your own sessions');
        }
        session.isRevoked = true;
        session.revokedAt = new Date();
        await session.save();
        return session;
    }
    async revokeCurrentSession(sessionId) {
        const session = await session_model_1.AuthSession.findById(sessionId);
        if (!session) {
            throw api_error_1.ApiError.NOT_FOUND('Session not found');
        }
        session.isRevoked = true;
        session.revokedAt = new Date();
        await session.save();
        return session;
    }
    async revokeByRefreshToken(refreshToken) {
        const payload = (0, auth_utils_1.verifyRefreshToken)(refreshToken);
        const session = await session_model_1.AuthSession.findById(payload.sid).select('+refreshTokenHash');
        if (!session || session.refreshTokenHash !== (0, auth_utils_1.hashToken)(refreshToken)) {
            throw api_error_1.ApiError.UNAUTHORIZED('Session expired');
        }
        session.isRevoked = true;
        session.revokedAt = new Date();
        await session.save();
        return session;
    }
    async revokeOtherSessions(userId, currentSessionId) {
        await session_model_1.AuthSession.updateMany({
            userId: new mongoose_1.Types.ObjectId(userId),
            _id: { $ne: new mongoose_1.Types.ObjectId(currentSessionId) },
        }, {
            $set: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
        return { message: 'Other sessions revoked successfully' };
    }
    async revokeAllSessions(userId) {
        await session_model_1.AuthSession.updateMany({
            userId: new mongoose_1.Types.ObjectId(userId),
        }, {
            $set: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
        return { message: 'All sessions revoked successfully' };
    }
    async createUser(payload) {
        const existingUser = await auth_model_1.User.findOne({ email: payload.email.toLowerCase().trim() });
        if (existingUser) {
            throw api_error_1.ApiError.BAD_REQUEST('Email already exists');
        }
        const user = await auth_model_1.User.create({
            name: payload.name.trim(),
            email: payload.email.toLowerCase().trim(),
            passwordHash: (0, auth_utils_1.hashPassword)(payload.password),
            role: (0, auth_utils_1.normalizeRole)(payload.role),
            isActive: true,
        });
        return mapUser(user);
    }
    async listUsers() {
        const users = await auth_model_1.User.find({}).sort({ createdAt: -1 });
        return users.map(mapUser);
    }
}
exports.AuthService = AuthService;
