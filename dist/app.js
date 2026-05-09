"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
// Routes
app.use('/api/auth', auth_route_1.default);
app.use('/api', auth_middleware_1.authenticateRequest);
app.use('/api/cattle', cattle_route_1.default);
app.use('/api/milk', milk_route_1.default);
app.use('/api/health', health_route_1.default);
app.use('/api/feeding', feeding_route_1.default);
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err?.statusCode || err?.status || 500;
    const message = err?.message || 'Internal server error';
    return res.status(statusCode).json(api_response_1.ApiResponse.error(message, err instanceof api_error_1.ApiError ? undefined : err?.stack));
});
exports.default = app;
