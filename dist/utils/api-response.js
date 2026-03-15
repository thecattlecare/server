"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(message, data, pagination) {
        return {
            success: true,
            message,
            data,
            pagination
        };
    }
    static error(message, error) {
        return {
            success: false,
            message,
            error: error instanceof Error ? error.message : error,
        };
    }
}
exports.ApiResponse = ApiResponse;
