import { z } from 'zod';
import { objectIdSchema } from '../../utils/validation';

export const healthValidation = {
  diseaseCreate: z.object({
    body: z.object({
      animalId: objectIdSchema,
      disease: z.string().min(1, 'Disease is required'),
      treatment: z.string().optional(),
      medicine: z.string().optional(),
      treatmentCost: z.number().min(0).optional(),
      status: z.enum(['Active', 'Critical', 'Chronic', 'Recovered']).optional(),
      startDate: z.string().or(z.date()),
      notes: z.string().max(500).optional(),
    }),
  }),

  diseaseUpdate: z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      disease: z.string().min(1).optional(),
      treatment: z.string().optional(),
      medicine: z.string().optional(),
      treatmentCost: z.number().min(0).optional(),
      status: z.enum(['Active', 'Critical', 'Chronic', 'Recovered']).optional(),
      startDate: z.string().or(z.date()).optional(),
      notes: z.string().max(500).optional(),
    }).refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required for update',
    }),
  }),

  vaccinationCreate: z.object({
    body: z.object({
      animalId: objectIdSchema,
      vaccineName: z.string().min(1, 'Vaccine name is required'),
      dose: z.string().min(1, 'Dose is required'),
      scheduledAt: z.string().or(z.date()),
      status: z.enum(['Scheduled', 'Completed', 'Missed']).optional(),
      notes: z.string().max(500).optional(),
    }),
  }),

  vaccinationUpdate: z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      vaccineName: z.string().min(1).optional(),
      dose: z.string().min(1).optional(),
      scheduledAt: z.string().or(z.date()).optional(),
      status: z.enum(['Scheduled', 'Completed', 'Missed']).optional(),
      notes: z.string().max(500).optional(),
    }).refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required for update',
    }),
  }),

  medicineCreate: z.object({
    body: z.object({
      name: z.string().min(1, 'Medicine name is required'),
      type: z.string().optional(),
      dose: z.string().optional(),
      stock: z.number().min(0),
      forDisease: z.string().optional(),
      lowStockThreshold: z.number().min(0).optional(),
    }),
  }),

  medicineUpdate: z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      name: z.string().min(1).optional(),
      type: z.string().optional(),
      dose: z.string().optional(),
      stock: z.number().min(0).optional(),
      forDisease: z.string().optional(),
      lowStockThreshold: z.number().min(0).optional(),
    }).refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required for update',
    }),
  }),

  stockAdjustment: z.object({
    params: z.object({ id: objectIdSchema }),
    body: z.object({
      delta: z.number(),
    }),
  }),
};
