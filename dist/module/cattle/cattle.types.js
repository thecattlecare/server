"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cattleQuerySchema = exports.updateCattleSchema = exports.createCattleSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod validation schemas for Cattle/Animal
 */
// Enum schemas
const genderEnum = zod_1.z.enum(['Male', 'Female']);
const groupEnum = zod_1.z.enum(['Cow', 'Bull', 'Heifer', 'Calf']);
const lactationStageEnum = zod_1.z.enum(['Early', 'Mid', 'Late', 'Dry']).optional();
const reproductiveStatusEnum = zod_1.z.enum(['Pregnant', 'Inseminated', 'Open']).optional();
const optionalDate = zod_1.z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : value), zod_1.z.coerce.date().optional());
// Create cattle schema
exports.createCattleSchema = zod_1.z.object({
    rfid: zod_1.z.string().trim().min(1, 'RFID is required'),
    tag: zod_1.z.string().trim().min(1, 'Tag is required').optional(),
    name: zod_1.z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    breed: zod_1.z.string().trim().min(1, 'Breed is required').max(100, 'Breed must be less than 100 characters'),
    gender: genderEnum,
    dob: zod_1.z.coerce.date(),
    weight: zod_1.z.number().nonnegative('Weight must be non-negative'),
    parity: zod_1.z.number().nonnegative('Parity must be non-negative').int().optional(),
    lactationStage: lactationStageEnum,
    reproductiveStatus: reproductiveStatusEnum,
    calvingDate: optionalDate,
    group: groupEnum.optional(),
    healthStatus: zod_1.z.string().trim().max(100, 'Health status must be less than 100 characters').optional(),
    origin: zod_1.z.string().trim().max(100, 'Origin must be less than 100 characters').optional(),
    notes: zod_1.z.string().trim().max(500, 'Notes must be less than 500 characters').optional(),
    isActive: zod_1.z.boolean().default(true).optional(),
});
// Update cattle schema (all fields optional)
exports.updateCattleSchema = exports.createCattleSchema.partial();
// Query filter schema
exports.cattleQuerySchema = zod_1.z.object({
    tag: zod_1.z.string().optional(),
    breed: zod_1.z.string().optional(),
    gender: genderEnum.optional(),
    isActive: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .transform((val) => (typeof val === 'boolean' ? val : val === 'true'))
        .optional(),
    page: zod_1.z.string().transform(Number).optional().pipe(zod_1.z.number().min(1).default(1)),
    limit: zod_1.z.string().transform(Number).optional().pipe(zod_1.z.number().min(1).max(100).default(10)),
    sort: zod_1.z.string().optional(),
    fields: zod_1.z.string().optional(),
    populate: zod_1.z.string().optional(),
}).strict();
