import { Document } from 'mongoose';
import { z } from 'zod';

export interface IAnimal extends Document {
  rfid: string;
  tag?: string;
  name: string;
  breed: string;
  gender: 'Male' | 'Female';
  dob: Date;
  weight: number;
  parity: number;
  lactationStage: 'Early' | 'Mid' | 'Late' | 'Dry';
  reproductiveStatus: 'Pregnant' | 'Inseminated' | 'Open';
  calvingDate?: Date;
  group: 'Cow' | 'Bull' | 'Heifer' | 'Calf';
  healthStatus?: string;
  origin?: string;
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

const optionalDate = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional()
);

// Create cattle schema
export const createCattleSchema = z.object({
  rfid: z.string().trim().min(1, 'RFID is required'),
  tag: z.string().trim().min(1, 'Tag is required').optional(),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  breed: z.string().trim().min(1, 'Breed is required').max(100, 'Breed must be less than 100 characters'),
  gender: genderEnum,
  dob: z.coerce.date(),
  weight: z.number().nonnegative('Weight must be non-negative'),
  parity: z.number().nonnegative('Parity must be non-negative').int().optional(),
  lactationStage: lactationStageEnum,
  reproductiveStatus: reproductiveStatusEnum,
  calvingDate: optionalDate,
  group: groupEnum.optional(),
  healthStatus: z.string().trim().max(100, 'Health status must be less than 100 characters').optional(),
  origin: z.string().trim().max(100, 'Origin must be less than 100 characters').optional(),
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
