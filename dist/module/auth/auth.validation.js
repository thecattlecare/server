"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
const zod_1 = require("zod");
exports.authValidation = {
    login: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email('Valid email is required'),
            password: zod_1.z.string().min(1, 'Password is required'),
        }),
    }),
    createUser: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
            email: zod_1.z.string().email('Valid email is required'),
            password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
            role: zod_1.z.enum(['admin', 'user']).optional(),
        }),
    }),
};
