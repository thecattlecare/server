"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const api_response_1 = require("../../utils/api-response");
const api_error_1 = require("../../utils/api-error");
const auth_validation_1 = require("./auth.validation");
const auth_service_1 = require("./auth.service");
const setRefreshCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 3,
        path: '/api/auth',
    });
};
const clearRefreshCookie = (res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth',
    });
};
class AuthController {
    constructor() {
        this.service = new auth_service_1.AuthService();
        this.login = async (req, res) => {
            const validated = auth_validation_1.authValidation.login.parse({ body: req.body });
            const result = await this.service.login(validated.body, req);
            setRefreshCookie(res, result.tokens.refreshToken);
            return res.status(200).json(api_response_1.ApiResponse.success('Login successful', {
                accessToken: result.tokens.accessToken,
                user: result.user,
                session: result.session,
                expiresIn: result.tokens.expiresIn,
            }));
        };
        this.refresh = async (req, res) => {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                throw api_error_1.ApiError.UNAUTHORIZED('Refresh token missing');
            }
            const result = await this.service.refresh(refreshToken, req);
            setRefreshCookie(res, result.tokens.refreshToken);
            return res.status(200).json(api_response_1.ApiResponse.success('Token refreshed successfully', {
                accessToken: result.tokens.accessToken,
                user: result.user,
                session: result.session,
                expiresIn: result.tokens.expiresIn,
            }));
        };
        this.logout = async (req, res) => {
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                try {
                    await this.service.revokeByRefreshToken(refreshToken);
                }
                catch {
                    // ignore invalid refresh token on logout
                }
            }
            clearRefreshCookie(res);
            return res.status(200).json(api_response_1.ApiResponse.success('Logged out successfully'));
        };
        this.logoutCurrent = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            await this.service.revokeCurrentSession(req.auth.sessionId);
            clearRefreshCookie(res);
            return res.status(200).json(api_response_1.ApiResponse.success('Current session logged out successfully'));
        };
        this.logoutOthers = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            const result = await this.service.revokeOtherSessions(req.auth.userId, req.auth.sessionId);
            return res.status(200).json(api_response_1.ApiResponse.success(result.message));
        };
        this.logoutAll = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            const result = await this.service.revokeAllSessions(req.auth.userId);
            clearRefreshCookie(res);
            return res.status(200).json(api_response_1.ApiResponse.success(result.message));
        };
        this.me = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            const user = await this.service.me(req.auth.userId, req.auth.sessionId);
            return res.status(200).json(api_response_1.ApiResponse.success('Current user fetched successfully', user));
        };
        this.getSessions = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            const sessions = await this.service.listSessions(req.auth.userId, req.auth.sessionId);
            return res.status(200).json(api_response_1.ApiResponse.success('Sessions fetched successfully', sessions));
        };
        this.revokeSession = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            const session = await this.service.revokeSession(req.params.id, req.auth.userId, req.auth.role);
            return res.status(200).json(api_response_1.ApiResponse.success('Session revoked successfully', session));
        };
        this.createUser = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            if (req.auth.role !== 'admin') {
                throw api_error_1.ApiError.FORBIDDEN('Admin access required');
            }
            const validated = auth_validation_1.authValidation.createUser.parse({ body: req.body });
            const user = await this.service.createUser(validated.body);
            return res.status(201).json(api_response_1.ApiResponse.success('User created successfully', user));
        };
        this.getUsers = async (req, res) => {
            if (!req.auth) {
                throw api_error_1.ApiError.UNAUTHORIZED('Authentication required');
            }
            if (req.auth.role !== 'admin') {
                throw api_error_1.ApiError.FORBIDDEN('Admin access required');
            }
            const users = await this.service.listUsers();
            return res.status(200).json(api_response_1.ApiResponse.success('Users fetched successfully', users));
        };
    }
}
exports.AuthController = AuthController;
