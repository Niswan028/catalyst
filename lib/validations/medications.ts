import { z } from 'zod';

export const createMedicationSchema = z.object({
  user_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Medication name is required').max(100),
  dosage: z.string().min(1, 'Dosage is required').max(50),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in 24-hour format HH:MM (e.g. 08:30)'),
  total_stock: z.number().int().min(0, 'Total stock cannot be negative'),
  low_stock_threshold: z.number().int().min(0).default(5),
});

export const updateMedicationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  dosage: z.string().min(1).max(50).optional(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in 24-hour format HH:MM')
    .optional(),
  total_stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const logMedicationSchema = z.object({
  medication_id: z.string().uuid(),
  status: z.enum(['taken', 'later', 'skipped']),
  scheduled_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid scheduled_time ISO string is required',
  }),
});
