import { z } from 'zod';

export const adherenceQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  period: z.enum(['7d', '14d', '30d', '90d']).default('7d'),
});

export type AdherenceQuery = z.infer<typeof adherenceQuerySchema>;
