import { z } from 'zod';

export const authValidation = {
  login: z.object({
    body: z.object({
      email: z.string().email('Valid email is required'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  createUser: z.object({
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters').max(100),
      email: z.string().email('Valid email is required'),
      phone: z.string().length(10, 'Phone number must be exactly 10 characters').startsWith('3').optional(),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      role: z.enum(['admin', 'user']).optional(),
    }),
  }),
};
