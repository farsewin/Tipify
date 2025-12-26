import { z } from 'zod';

export const branchSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  name: z.string().min(1).max(100),
  location: z.string().max(255).nullable(),
  slug: z.string().min(1).max(100), // Unique per company
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Branch = z.infer<typeof branchSchema>;

export const createBranchSchema = branchSchema.pick({
  id: true,
  companyId: true,
  name: true,
  location: true,
  slug: true,
  active: true,
});

export type CreateBranch = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = branchSchema.partial().pick({
  name: true,
  location: true,
  active: true,
});

export type UpdateBranch = z.infer<typeof updateBranchSchema>;

