"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cattle_route_1 = __importDefault(require("./module/cattle/cattle.route"));
const milk_route_1 = __importDefault(require("./module/milk/milk.route"));
const health_route_1 = __importDefault(require("./module/health/health.route"));
const feeding_route_1 = __importDefault(require("./module/feeding/feeding.route"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
// Routes
app.use('/api/cattle', cattle_route_1.default);
app.use('/api/milk', milk_route_1.default);
app.use('/api/health', health_route_1.default);
app.use('/api/feeding', feeding_route_1.default);
exports.default = app;
