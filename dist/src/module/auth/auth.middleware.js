"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = exports.authenticateRequest = void 0;
const api_error_1 = require("../../utils/api-error");
const session_model_1 = require("./session.model");
const auth_utils_1 = require("./auth.utils");
const authenticateRequest = async (req, _res, next) => {
    try {
        const token = (0, auth_utils_1.getBearerToken)(req.headers.authorization);
        if (!token) {
            throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
        }
        const payload = (0, auth_utils_1.verifyAccessToken)(token);
        const session = await session_model_1.AuthSession.findById(payload.sid).lean();
        if (!session || session.isRevoked || session.expiresAt.getTime() <= Date.now()) {
            throw api_error_1.ApiError.UNAUTHORIZED('Session expired');
        }
        req.auth = {
            userId: payload.sub,
            sessionId: payload.sid,
            role: payload.role,
            email: payload.email,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateRequest = authenticateRequest;
const authorizeAdmin = (req, _res, next) => {
    if (req.auth?.role !== 'admin') {
        return next(api_error_1.ApiError.FORBIDDEN('Admin access required'));
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
