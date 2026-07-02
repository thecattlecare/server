import { Document, Types } from 'mongoose';
import { z } from 'zod';

export interface ITask extends Document {
  title: string;
  description?: string;
  assignedTo?: string | Types.ObjectId; // userId of person assigned to task
  assignedBy: string | Types.ObjectId; // userId of person who assigned the task
  type: 'once' | 'daily';
  isCompleted: boolean;
  createdAt: Date;
  startDate: Date;
  endDate?: Date; // Only if type is 'once', optional for 'daily'
  visibility: 'public' | 'private';
  lastCompletedAt?: Date; // Track last completion date for daily tasks
  completionHistory: {
    date: Date;
    completedAt: Date;
  }[];
  updatedAt: Date;
}

/**
 * Zod validation schemas for Task
 */

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().trim().max(1000, 'Description must be less than 1000 characters').optional(),
  assignedTo: z.string().trim().min(1, 'Assigned to user ID is required'),
  type: z.enum(['once', 'daily']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  visibility: z.enum(['public', 'private']).default('private'),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().trim().max(1000, 'Description must be less than 1000 characters').optional(),
  assignedTo: z.string().trim().min(1, 'Assigned to user ID is required').optional(),
  type: z.enum(['once', 'daily']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

export const markTaskCompleteSchema = z.object({
  isCompleted: z.boolean(),
});

export const taskQuerySchema = z.object({
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  type: z.enum(['once', 'daily']).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  status: z.enum(['completed', 'pending']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
