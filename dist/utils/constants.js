"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PAGINATION = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500
};
exports.DEFAULT_PAGINATION = {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100
};
