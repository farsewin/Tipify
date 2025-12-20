import { z } from 'zod';

export const auditLogSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable(),
  userId: z.string().nullable(),
  action: z.string().min(1),
  metadata: z.record(z.any()).nullable(), // JSON structure
  createdAt: z.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export const createAuditLogSchema = auditLogSchema.pick({
  id: true,
  companyId: true,
  userId: true,
  action: true,
  metadata: true,
});

export type CreateAuditLog = z.infer<typeof createAuditLogSchema>;

