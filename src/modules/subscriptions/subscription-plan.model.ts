import { z } from 'zod';

export const subscriptionPlanNameSchema = z.enum(['Basic', 'Pro', 'Enterprise']);
export type SubscriptionPlanName = z.infer<typeof subscriptionPlanNameSchema>;

export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: subscriptionPlanNameSchema,
  monthlyPricePerBranch: z.number().int().positive(), // In cents
  features: z.record(z.any()).nullable(), // JSON structure
  paymentProviderPriceId: z.string().nullable(),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const createSubscriptionPlanSchema = subscriptionPlanSchema.pick({
  id: true,
  name: true,
  monthlyPricePerBranch: true,
  features: true,
  paymentProviderPriceId: true,
  active: true,
});

export type CreateSubscriptionPlan = z.infer<typeof createSubscriptionPlanSchema>;

