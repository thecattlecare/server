import { Document, Types } from 'mongoose';
import { z } from 'zod';

interface ISemenInfo {
  bullName?: string;
  breed?: string;
  source?: string;
  strawCode?: string;
}

export interface IAnimal extends Document {
  tag?: string;
  name: string;
  breed: string;
  gender: 'Male' | 'Female';
  dob: Date;
  weight: number;
  group: 'Cow' | 'Bull' | 'Heifer' | 'Calf';
  parity?: number;
  lactationStage?: 'Early' | 'Mid' | 'Late' | 'Dry';
  reproductiveStatus?: 'Pregnant' | 'Inseminated' | 'Open';
  calvingDate?: Date;
  dam?: Types.ObjectId;
  sireType?: 'bull' | 'semen' | 'unknown';
  sire?: Types.ObjectId;
  semenInfo?: ISemenInfo;
  healthStatus?: string;
  origin?: 'Born on Farm' | 'Purchased';
  purchaseRate?: Number;
  purchaseDate?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Zod validation schemas for Cattle/Animal
 */

// Enum schemas
const genderEnum = z.enum(['Male', 'Female']);
const groupEnum = z.enum(['Cow', 'Bull', 'Heifer', 'Calf']);
const lactationStageEnum = z.enum(['Early', 'Mid', 'Late', 'Dry']).optional();
const reproductiveStatusEnum = z.enum(['Pregnant', 'Inseminated', 'Open']).optional();
const sireEnum = z.enum(['bull', 'semen', 'unknown']).optional();
const SemenInfoSchema = z.object({
  bullName: z.string().optional(),
  breed: z.string().optional(),
  source: z.string().optional(),
  strawCode: z.string().optional(),
}).optional();

const optionalDate = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional()
);

// Create cattle schema
export const createCattleSchema = z.object({
  tag: z.string().trim().min(1, 'Tag is required').optional(),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  breed: z.string().trim().min(1, 'Breed is required').max(100, 'Breed must be less than 100 characters'),
  gender: genderEnum,
  dob: z.coerce.date(),
  weight: z.number().nonnegative('Weight must be non-negative'),
  group: groupEnum.optional(),
  parity: z.number().nonnegative('Parity must be non-negative').int().optional(),
  lactationStage: lactationStageEnum,
  reproductiveStatus: reproductiveStatusEnum,
  calvingDate: optionalDate,
  dam: z.string().trim().optional(),
  sireType: sireEnum,
  sire: z.string().trim().optional(),
  semenInfo: SemenInfoSchema,
  healthStatus: z.string().trim().max(100, 'Health status must be less than 100 characters').optional(),
  origin: z.enum(['Born on Farm', 'Purchased']).optional(),
  purchaseRate: z.number().nonnegative('Purchasing Amount should always positive').int().optional(),
  purchaseDate: optionalDate,
  notes: z.string().trim().max(500, 'Notes must be less than 500 characters').optional(),
  isActive: z.boolean().default(true).optional(),
});

// Update cattle schema (all fields optional)
export const updateCattleSchema = createCattleSchema.partial();

// Query filter schema
export const cattleQuerySchema = z.object({
  tag: z.string().optional(),
  breed: z.string().optional(),
  gender: genderEnum.optional(),
  group: groupEnum.optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((val) => (typeof val === 'boolean' ? val : val === 'true'))
    .optional(),
  page: z.string().transform(Number).optional().pipe(z.number().min(1).default(1)),
  limit: z.string().transform(Number).optional().pipe(z.number().min(1).max(100).default(10)),
  sort: z.string().optional(),
  fields: z.string().optional(),
  populate: z.string().optional(),
}).strict();

// Type definitions
export type CreateCattleInput = z.infer<typeof createCattleSchema>;
export type UpdateCattleInput = z.infer<typeof updateCattleSchema>;
export type CattleQueryInput = z.infer<typeof cattleQuerySchema>;
