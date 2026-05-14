"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="./types/express.d.ts" />
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cattle_route_1 = __importDefault(require("./module/cattle/cattle.route"));
const milk_route_1 = __importDefault(require("./module/milk/milk.route"));
const health_route_1 = __importDefault(require("./module/health/health.route"));
const feeding_route_1 = __importDefault(require("./module/feeding/feeding.route"));
const auth_route_1 = __importDefault(require("./module/auth/auth.route"));
const auth_middleware_1 = require("./module/auth/auth.middleware");
const api_response_1 = require("./utils/api-response");
const api_error_1 = require("./utils/api-error");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json({ limit: '5mb' })); // Added limit for larger payloads
app.use((0, cookie_parser_1.default)());
// CORS configuration for both dev and production
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Health check endpoint (useful for Vercel)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// Routes
app.use('/api/auth', auth_route_1.default);
// Protected routes
app.use('/api', auth_middleware_1.authenticateRequest);
app.use('/api/cattle', cattle_route_1.default);
app.use('/api/milk', milk_route_1.default);
app.use('/api/health', health_route_1.default);
app.use('/api/feeding', feeding_route_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json(api_response_1.ApiResponse.error('Route not found'));
});
// Global error handler
app.use((err, req, res, next) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err?.statusCode || err?.status || 500;
    const message = err?.message || 'Internal server error';
    // Don't expose stack traces in production
    const response = process.env.NODE_ENV === 'production'
        ? api_response_1.ApiResponse.error(message)
        : api_response_1.ApiResponse.error(message, err instanceof api_error_1.ApiError ? undefined : err?.stack);
    return res.status(statusCode).json(response);
});
exports.default = app;
