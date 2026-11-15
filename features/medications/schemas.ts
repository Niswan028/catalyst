import { z } from 'zod';

export const medicationScheduleSchema = z.object({
  type: z.enum(['daily', 'specific_days', 'as_needed']).default('daily'),
  days_of_week: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
  times: z
    .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time format must be HH:MM'))
    .min(1, 'At least one scheduled dose time is required'),
});

export const createMedicationSchema = z.object({
  user_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Medication name is required').max(100),
  dosage: z.string().min(1, 'Dosage is required').max(50),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Primary dose time must be in HH:MM format')
    .optional(),
  schedule: medicationScheduleSchema.optional(),
  instructions: z.string().max(500).optional().nullable(),
  total_stock: z.number().int().min(0, 'Total stock cannot be negative').default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
});

export const updateMedicationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  dosage: z.string().min(1).max(50).optional(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time format must be HH:MM')
    .optional(),
  schedule: medicationScheduleSchema.optional(),
  instructions: z.string().max(500).optional().nullable(),
  total_stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const logDoseSchema = z.object({
  medication_id: z.string().uuid(),
  status: z.enum(['taken', 'skipped', 'missed', 'later']),
  scheduled_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid scheduled_time ISO string is required',
  }),
  notes: z.string().max(300).optional().nullable(),
});

export const logMedicationSchema = logDoseSchema;

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type LogDoseInput = z.infer<typeof logDoseSchema>;
export type LogMedicationInput = LogDoseInput;
export type MedicationSchedule = z.infer<typeof medicationScheduleSchema>;
