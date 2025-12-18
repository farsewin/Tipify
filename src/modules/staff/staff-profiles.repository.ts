import { and, eq } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { staffProfiles } from '@/drizzle/schema';
import type {
  CreateStaffProfile,
  StaffProfile,
  UpdateStaffProfile,
} from '@/src/modules/staff/staff-profile.model';

export class StaffProfilesRepository {
  private static instance: StaffProfilesRepository;

  private constructor() {}

  static getInstance(): StaffProfilesRepository {
    if (!StaffProfilesRepository.instance) {
      StaffProfilesRepository.instance = new StaffProfilesRepository();
    }
    return StaffProfilesRepository.instance;
  }

  async getStaffProfile(
    id: string,
    tx?: Transaction
  ): Promise<StaffProfile | undefined> {
    const invoker = tx ?? db;
    return invoker.query.staffProfiles.findFirst({ where: eq(staffProfiles.id, id) });
  }

  async getStaffProfileByPublicId(
    publicId: string,
    tx?: Transaction
  ): Promise<StaffProfile | undefined> {
    const invoker = tx ?? db;
    return invoker.query.staffProfiles.findFirst({
      where: eq(staffProfiles.publicId, publicId),
    });
  }

  async getStaffProfilesByCompany(
    companyId: string,
    tx?: Transaction
  ): Promise<StaffProfile[]> {
    const invoker = tx ?? db;
    return invoker.query.staffProfiles.findMany({
      where: eq(staffProfiles.companyId, companyId),
    });
  }

  async getStaffProfilesByBranch(
    branchId: string,
    tx?: Transaction
  ): Promise<StaffProfile[]> {
    const invoker = tx ?? db;
    return invoker.query.staffProfiles.findMany({
      where: eq(staffProfiles.branchId, branchId),
    });
  }

  async getActiveStaffProfilesByBranch(
    branchId: string,
    tx?: Transaction
  ): Promise<StaffProfile[]> {
    const invoker = tx ?? db;
    return invoker.query.staffProfiles.findMany({
      where: and(eq(staffProfiles.branchId, branchId), eq(staffProfiles.active, true)),
    });
  }

  async getStaffProfilesByUser(
    userId: string,
    tx?: Transaction
  ): Promise<StaffProfile[]> {
    const invoker = tx ?? db;
    return invoker.query.staffProfiles.findMany({
      where: eq(staffProfiles.userId, userId),
    });
  }

  async createStaffProfile(
    input: CreateStaffProfile,
    tx?: Transaction
  ): Promise<StaffProfile> {
    const invoker = tx ?? db;
    const [created] = await invoker.insert(staffProfiles).values(input).returning();

    if (!created) throw new Error('Cannot create staff profile');

    return created;
  }

  async updateStaffProfile(
    id: string,
    updates: UpdateStaffProfile,
    tx?: Transaction
  ): Promise<StaffProfile> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(staffProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staffProfiles.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update staff profile');

    return updated;
  }

  async deleteStaffProfile(id: string, tx?: Transaction): Promise<void> {
    const invoker = tx ?? db;
    await invoker.delete(staffProfiles).where(eq(staffProfiles.id, id));
  }
}

