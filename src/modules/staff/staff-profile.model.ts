import { z } from 'zod';

export const staffProfileSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  branchId: z.string(),
  userId: z.string(), // Required - staff must have a user account
  displayName: z.string().min(1).max(100),
  position: z.string().max(100).nullable(),
  avatarUrl: z.string().url().nullable(),
  publicId: z.string(), // Unique public ID for QR codes
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StaffProfile = z.infer<typeof staffProfileSchema>;

export const createStaffProfileSchema = staffProfileSchema.pick({
  id: true,
  companyId: true,
  branchId: true,
  userId: true,
  displayName: true,
  position: true,
  avatarUrl: true,
  publicId: true,
  active: true,
});

export type CreateStaffProfile = z.infer<typeof createStaffProfileSchema>;

export const updateStaffProfileSchema = staffProfileSchema.partial().pick({
  displayName: true,
  position: true,
  avatarUrl: true,
  active: true,
  branchId: true,
});

export type UpdateStaffProfile = z.infer<typeof updateStaffProfileSchema>;

