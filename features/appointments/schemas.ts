import { z } from 'zod';

export const createAppointmentSchema = z.object({
  circle_id: z.string().uuid().optional(),
  doctor_name: z.string().min(2, 'Doctor name must be at least 2 characters').max(100),
  specialty: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  datetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid appointment date and time is required',
  }),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['upcoming', 'done', 'cancelled']).default('upcoming'),
});

export const updateAppointmentSchema = z.object({
  doctor_name: z.string().min(2).max(100).optional(),
  specialty: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  datetime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid appointment date and time is required',
    })
    .optional(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['upcoming', 'done', 'cancelled']).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
