import { z } from 'zod';

export const payoutItemSchema = z.object({
  id: z.string(),
  payoutBatchId: z.string(),
  staffProfileId: z.string(),
  amount: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayoutItem = z.infer<typeof payoutItemSchema>;

export const createPayoutItemSchema = payoutItemSchema.pick({
  id: true,
  payoutBatchId: true,
  staffProfileId: true,
  amount: true,
  currency: true,
});

export type CreatePayoutItem = z.infer<typeof createPayoutItemSchema>;

