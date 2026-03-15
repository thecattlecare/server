"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.paginationSchema = exports.objectIdSchema = exports.validateObjectId = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
/**
 * Validates that a string is a valid MongoDB ObjectId
 */
const validateObjectId = (value) => {
    return mongoose_1.Types.ObjectId.isValid(value);
};
exports.validateObjectId = validateObjectId;
/**
 * Zod schema for MongoDB ObjectId validation
 */
exports.objectIdSchema = zod_1.z
    .string()
    .refine(exports.validateObjectId, 'Invalid ObjectId format');
/**
 * Zod schema for pagination query parameters
 */
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().pipe(zod_1.z.number().min(1).default(1)),
    limit: zod_1.z.string().transform(Number).optional().pipe(zod_1.z.number().min(1).max(100).default(10)),
    sort: zod_1.z.string().optional(),
    fields: zod_1.z.string().optional(),
    populate: zod_1.z.string().optional(),
}).strict();
/**
 * Zod schema for ID parameter validation
 */
exports.idParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
