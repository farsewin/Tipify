import { z } from 'zod';

export const userRoleSchema = z.enum(['ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password_hash: z.string().min(6).max(255),
  role: userRoleSchema.default('STAFF'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserSchema = userSchema
  .pick({ id: true, name: true, email: true, role: true })
  .merge(z.object({ password: z.string().min(8).max(255) }));

export type CreateUser = z.infer<typeof createUserSchema>;