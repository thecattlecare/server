import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Validates that a string is a valid MongoDB ObjectId
 */
export const validateObjectId = (value: string) => {
  return Types.ObjectId.isValid(value);
};

/**
 * Zod schema for MongoDB ObjectId validation
 */
export const objectIdSchema = z
  .string()
  .refine(validateObjectId, 'Invalid ObjectId format');

/**
 * Zod schema for pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.string().transform(Number).optional().pipe(z.number().min(1).default(1)),
  limit: z.string().transform(Number).optional().pipe(z.number().min(1).max(100).default(10)),
  sort: z.string().optional(),
  fields: z.string().optional(),
  populate: z.string().optional(),
}).strict();

/**
 * Zod schema for ID parameter validation
 */
export const idParamSchema = z.object({
  id: objectIdSchema,
});

/**
 * Type definitions from Zod schemas
 */
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
