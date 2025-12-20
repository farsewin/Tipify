import { z } from 'zod';

export const companyMemberRoleSchema = z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF']);
export type CompanyMemberRole = z.infer<typeof companyMemberRoleSchema>;

export const companyMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  companyId: z.string(),
  role: companyMemberRoleSchema.default('STAFF'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyMember = z.infer<typeof companyMemberSchema>;

export const createCompanyMemberSchema = companyMemberSchema.pick({
  id: true,
  userId: true,
  companyId: true,
  role: true,
});

export type CreateCompanyMember = z.infer<typeof createCompanyMemberSchema>;

