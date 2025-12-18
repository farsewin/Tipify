import { z } from 'zod';

export const payoutBatchStatusSchema = z.enum(['PENDING', 'COMPLETED']);
export type PayoutBatchStatus = z.infer<typeof payoutBatchStatusSchema>;

export const payoutBatchSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  branchId: z.string().nullable(), // Nullable for company-wide payouts
  processedByUserId: z.string(),
  payoutDate: z.date(),
  totalAmount: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  status: payoutBatchStatusSchema.default('PENDING'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayoutBatch = z.infer<typeof payoutBatchSchema>;

export const createPayoutBatchSchema = payoutBatchSchema.pick({
  id: true,
  companyId: true,
  branchId: true,
  processedByUserId: true,
  payoutDate: true,
  totalAmount: true,
  currency: true,
});

export type CreatePayoutBatch = z.infer<typeof createPayoutBatchSchema>;

