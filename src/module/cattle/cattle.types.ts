import { Document } from "mongoose"
import { z } from 'zod';

export interface IAnimal extends Document {
  tag?: string;
  name?: string;
  breed: string;
  gender: 'cow' | 'bull' | 'heifer' | 'calf';
  dateOfBirth?: Date;
  weight?: number;
  parity?: number;
  lactationStage?: 'early' | 'mid' | 'late' | 'dry';
  reproductiveStatus?: 'pregnant' | 'inseminated' | 'open';
  purchaseDate?: Date;
  purchasePrice?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Zod validation schemas for Cattle/Animal
 */

// Enum schemas
const genderEnum = z.enum(['cow', 'bull', 'heifer', 'calf']);
const lactationStageEnum = z.enum(['early', 'mid', 'late', 'dry']).optional();
const reproductiveStatusEnum = z.enum(['pregnant', 'inseminated', 'open']).optional();

// Create cattle schema
export const createCattleSchema = z.object({
  tag: z.string().trim().min(1, 'Tag is required').optional(),
  name: z.string().trim().max(100, 'Name must be less than 100 characters').optional(),
  breed: z.string().trim().min(1, 'Breed is required').max(100, 'Breed must be less than 100 characters'),
  gender: genderEnum.refine(val => val, 'Gender is required'),
  dateOfBirth: z.string().datetime().optional().or(z.date()),
  weight: z.number().positive('Weight must be positive').optional(),
  parity: z.number().nonnegative('Parity must be non-negative').int().optional(),
  lactationStage: lactationStageEnum,
  reproductiveStatus: reproductiveStatusEnum,
  purchaseDate: z.string().datetime().optional().or(z.date()),
  purchasePrice: z.number().nonnegative('Purchase price must be non-negative').optional(),
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
  isActive: z.string().transform(val => val === 'true').optional(),
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
