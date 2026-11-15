import { z } from 'zod';

export const createCircleSchema = z.object({
  name: z.string().min(2, 'Circle name must be at least 2 characters').max(50),
});

export const createInviteSchema = z.object({
  role: z.enum(['editor', 'viewer']),
  max_uses: z.number().int().min(1).max(50).default(1),
  expiry_hours: z.number().int().min(24).max(168).default(48), // 24 hours to 7 days
});

export const joinCircleSchema = z.object({
  passcode: z
    .string()
    .min(6, 'Passcode must be at least 6 characters')
    .max(8, 'Passcode cannot exceed 8 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Passcode must contain only letters and numbers'),
});

export const updateMemberSchema = z.object({
  member_id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'revoked']).optional(),
  role: z.enum(['editor', 'viewer']).optional(),
  permissions: z
    .object({
      medications: z.boolean().optional(),
      appointments: z.boolean().optional(),
      health_checkins: z.boolean().optional(),
      voice_messages: z.boolean().optional(),
    })
    .optional(),
  notification_preferences: z
    .object({
      upcoming_doses: z.boolean().optional(),
      missed_doses: z.boolean().optional(),
      appointments: z.boolean().optional(),
      weekly_digest: z.boolean().optional(),
    })
    .optional(),
});
