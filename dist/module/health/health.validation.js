"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthValidation = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../utils/validation");
exports.healthValidation = {
    diseaseCreate: zod_1.z.object({
        body: zod_1.z.object({
            animalId: validation_1.objectIdSchema,
            disease: zod_1.z.string().min(1, 'Disease is required'),
            medicine: zod_1.z.string().optional(),
            status: zod_1.z.enum(['Active', 'Critical', 'Chronic', 'Recovered']).optional(),
            startDate: zod_1.z.string().or(zod_1.z.date()),
            notes: zod_1.z.string().max(500).optional(),
        }),
    }),
    diseaseUpdate: zod_1.z.object({
        params: zod_1.z.object({ id: validation_1.objectIdSchema }),
        body: zod_1.z.object({
            disease: zod_1.z.string().min(1).optional(),
            medicine: zod_1.z.string().optional(),
            status: zod_1.z.enum(['Active', 'Critical', 'Chronic', 'Recovered']).optional(),
            startDate: zod_1.z.string().or(zod_1.z.date()).optional(),
            notes: zod_1.z.string().max(500).optional(),
        }).refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required for update',
        }),
    }),
    vaccinationCreate: zod_1.z.object({
        body: zod_1.z.object({
            animalId: validation_1.objectIdSchema,
            vaccineName: zod_1.z.string().min(1, 'Vaccine name is required'),
            dose: zod_1.z.string().min(1, 'Dose is required'),
            scheduledAt: zod_1.z.string().or(zod_1.z.date()),
            status: zod_1.z.enum(['Scheduled', 'Completed', 'Missed']).optional(),
            notes: zod_1.z.string().max(500).optional(),
        }),
    }),
    vaccinationUpdate: zod_1.z.object({
        params: zod_1.z.object({ id: validation_1.objectIdSchema }),
        body: zod_1.z.object({
            vaccineName: zod_1.z.string().min(1).optional(),
            dose: zod_1.z.string().min(1).optional(),
            scheduledAt: zod_1.z.string().or(zod_1.z.date()).optional(),
            status: zod_1.z.enum(['Scheduled', 'Completed', 'Missed']).optional(),
            notes: zod_1.z.string().max(500).optional(),
        }).refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required for update',
        }),
    }),
    medicineCreate: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Medicine name is required'),
            type: zod_1.z.string().optional(),
            dose: zod_1.z.string().optional(),
            stock: zod_1.z.number().min(0),
            forDisease: zod_1.z.string().optional(),
            lowStockThreshold: zod_1.z.number().min(0).optional(),
        }),
    }),
    medicineUpdate: zod_1.z.object({
        params: zod_1.z.object({ id: validation_1.objectIdSchema }),
        body: zod_1.z.object({
            name: zod_1.z.string().min(1).optional(),
            type: zod_1.z.string().optional(),
            dose: zod_1.z.string().optional(),
            stock: zod_1.z.number().min(0).optional(),
            forDisease: zod_1.z.string().optional(),
            lowStockThreshold: zod_1.z.number().min(0).optional(),
        }).refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required for update',
        }),
    }),
    stockAdjustment: zod_1.z.object({
        params: zod_1.z.object({ id: validation_1.objectIdSchema }),
        body: zod_1.z.object({
            delta: zod_1.z.number(),
        }),
    }),
};
