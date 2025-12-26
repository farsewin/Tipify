import { z } from 'zod';

export const subscriptionPlanSchema = z.enum(['BASIC', 'PRO', 'ENTERPRISE']);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionStatusSchema = z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED']);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  legalName: z.string().max(200).nullable(),
  slug: z.string().min(1).max(100), // Unique slug for public URLs
  country: z.string().min(2).max(2), // ISO country code
  subscriptionPlan: subscriptionPlanSchema.default('BASIC'),
  subscriptionStatus: subscriptionStatusSchema.default('TRIALING'),
  paymentProviderCustomerId: z.string().nullable(),
  paymentProviderSubscriptionId: z.string().nullable(),
  trialEndsAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Company = z.infer<typeof companySchema>;

export const createCompanySchema = companySchema.pick({
  id: true,
  name: true,
  legalName: true,
  slug: true,
  country: true,
  subscriptionPlan: true,
  trialEndsAt: true,
});

export type CreateCompany = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = companySchema.partial().pick({
  name: true,
  legalName: true,
  country: true,
});

export type UpdateCompany = z.infer<typeof updateCompanySchema>;

