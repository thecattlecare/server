"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
    static BAD_REQUEST(message) {
        return new ApiError(400, message);
    }
    static UNAUTHORIZED(message) {
        return new ApiError(401, message);
    }
    static FORBIDDEN(message) {
        return new ApiError(403, message);
    }
    static NOT_FOUND(message) {
        return new ApiError(404, message);
    }
    static INTERNAL_SERVER_ERROR(message) {
        return new ApiError(500, message);
    }
}
exports.ApiError = ApiError;
