"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.milkValidation = void 0;
const zod_1 = require("zod");
exports.milkValidation = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            cattleId: zod_1.z.string({
                required_error: 'Cattle ID is required',
            }).min(1, 'Cattle ID cannot be empty'),
            amount: zod_1.z.number({
                required_error: 'Amount is required',
                invalid_type_error: 'Amount must be a number',
            }).positive('Amount must be positive')
                .max(100, 'Amount cannot exceed 100 liters'),
            shift: zod_1.z.enum(['Morning', 'Evening'], {
                required_error: 'Shift is required',
                invalid_type_error: 'Shift must be either Morning or Evening',
            }),
            date: zod_1.z.string()
                .or(zod_1.z.date())
                .transform(val => new Date(val))
                .refine(date => date <= new Date(), {
                message: 'Date cannot be in the future'
            }),
            notes: zod_1.z.string()
                .max(500, 'Notes cannot exceed 500 characters')
                .optional(),
        }),
    }),
    update: zod_1.z.object({
        params: zod_1.z.object({
            id: zod_1.z.string().min(1, 'Record ID is required'),
        }),
        body: zod_1.z.object({
            amount: zod_1.z.number()
                .positive('Amount must be positive')
                .max(100, 'Amount cannot exceed 100 liters')
                .optional(),
            shift: zod_1.z.enum(['Morning', 'Evening']).optional(),
            date: zod_1.z.string()
                .or(zod_1.z.date())
                .transform(val => new Date(val))
                .refine(date => date <= new Date(), {
                message: 'Date cannot be in the future'
            })
                .optional(),
            notes: zod_1.z.string()
                .max(500, 'Notes cannot exceed 500 characters')
                .optional(),
        }).refine(data => Object.keys(data).length > 0, {
            message: 'At least one field must be provided for update'
        }),
    }),
    getRecords: zod_1.z.object({
        query: zod_1.z.object({
            cattleId: zod_1.z.string().optional(),
            shift: zod_1.z.enum(['Morning', 'Evening']).optional(),
            startDate: zod_1.z.string()
                .transform(val => new Date(val))
                .optional(),
            endDate: zod_1.z.string()
                .transform(val => new Date(val))
                .optional(),
            page: zod_1.z.string()
                .transform(val => parseInt(val))
                .refine(val => val > 0, 'Page must be positive')
                .optional(),
            limit: zod_1.z.string()
                .transform(val => parseInt(val))
                .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
                .optional(),
            sortBy: zod_1.z.string().optional(),
            sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
        }),
    }),
};
