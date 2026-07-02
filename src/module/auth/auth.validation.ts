import { z } from 'zod';

export const authValidation = {
  login: z.object({
    body: z.object({
      email: z.string().email('Valid email is required').optional(),
      phone: z.string().optional(),
      password: z.string().min(1, 'Password is required'),
    }).refine((data) => data.email || data.phone, {
      message: 'Either email or phone number is required',
      path: ['email'], // or ['phone'] - this is where the error will be attached
    }).refine((data) => {
      // If phone is provided, validate it's 10 digits and starts with 3
      if (data.phone) {
        const phoneRegex = /^3[0-9]{9}$/; // Exactly 10 digits, starts with 3
        return phoneRegex.test(data.phone);
      }
      return true;
    }, {
      message: 'Phone number must be 10 digits and start with 3 (e.g., 3184757136)',
      path: ['phone'],
    }),
  }),

  createUser: z.object({
    body: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters').max(100),
      email: z.string().email('Valid email is required'),
      phone: z.string().length(10, 'Phone number must be exactly 10 characters').startsWith('3').optional(),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      role: z.enum(['admin', 'user']).optional(),
      salary: z.number().min(0).optional(),
    }),
  }),
};
