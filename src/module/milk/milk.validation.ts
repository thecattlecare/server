import { z } from 'zod';

export const milkValidation = {
  create: z.object({
    body: z.object({
      cattleId: z.string({
        required_error: 'Cattle ID is required',
      }).min(1, 'Cattle ID cannot be empty'),
      
      amount: z.number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
      }).positive('Amount must be positive')
        .max(100, 'Amount cannot exceed 100 liters'),
      
      shift: z.enum(['Morning', 'Evening'], {
        required_error: 'Shift is required',
        invalid_type_error: 'Shift must be either Morning or Evening',
      }),
      
      date: z.string()
        .or(z.date())
        .transform(val => new Date(val))
        .refine(date => date <= new Date(), {
          message: 'Date cannot be in the future'
        }),
      
      notes: z.string()
        .max(500, 'Notes cannot exceed 500 characters')
        .optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      id: z.string().min(1, 'Record ID is required'),
    }),
    body: z.object({
      amount: z.number()
        .positive('Amount must be positive')
        .max(100, 'Amount cannot exceed 100 liters')
        .optional(),
      
      shift: z.enum(['Morning', 'Evening']).optional(),
      
      date: z.string()
        .or(z.date())
        .transform(val => new Date(val))
        .refine(date => date <= new Date(), {
          message: 'Date cannot be in the future'
        })
        .optional(),
      
      notes: z.string()
        .max(500, 'Notes cannot exceed 500 characters')
        .optional(),
    }).refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    }),
  }),

  getRecords: z.object({
    query: z.object({
      cattleId: z.string().optional(),
      shift: z.enum(['Morning', 'Evening']).optional(),
      startDate: z.string()
        .transform(val => new Date(val))
        .optional(),
      endDate: z.string()
        .transform(val => new Date(val))
        .optional(),
      page: z.string()
        .transform(val => parseInt(val))
        .refine(val => val > 0, 'Page must be positive')
        .optional(),
      limit: z.string()
        .transform(val => parseInt(val))
        .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
        .optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
  }),
};