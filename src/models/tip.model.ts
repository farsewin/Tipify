import { z } from 'zod';

export const paymentStatusSchema = z.enum(['SUCCEEDED', 'PENDING', 'FAILED']);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const distributionStatusSchema = z.enum(['PENDING', 'PAID']);
export type DistributionStatus = z.infer<typeof distributionStatusSchema>;

export const paymentProviderSchema = z.enum(['STRIPE', 'LOCAL_GATEWAY']);
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

export const tipSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  branchId: z.string(),
  staffProfileId: z.string(),
  amount: z.number().int().positive(), // Amount in smallest currency unit (cents) - QAR
  paymentStatus: paymentStatusSchema.default('PENDING'),
  distributionStatus: distributionStatusSchema.default('PENDING'),
  paymentProvider: paymentProviderSchema.default('STRIPE'),
  paymentProviderTransactionId: z.string().nullable(),
  customerNote: z.string().max(500).nullable(),
  customerRating: z.number().int().min(1).max(5).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tip = z.infer<typeof tipSchema>;

export const createTipSchema = tipSchema.pick({
  id: true,
  companyId: true,
  branchId: true,
  staffProfileId: true,
  amount: true,
  paymentProvider: true,
  paymentProviderTransactionId: true,
  customerNote: true,
  customerRating: true,
});

export type CreateTip = z.infer<typeof createTipSchema>;

export const updateTipSchema = tipSchema.partial().pick({
  paymentStatus: true,
  distributionStatus: true,
  customerNote: true,
  customerRating: true,
});

export type UpdateTip = z.infer<typeof updateTipSchema>;

