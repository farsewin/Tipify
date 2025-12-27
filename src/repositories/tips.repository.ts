import { and, eq, gte, lte, desc } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { tips, branches, staffProfiles } from '@/drizzle/schema';
import type { CreateTip, Tip, UpdateTip } from '@/src/models/tip.model';

export class TipsRepository {
  private static instance: TipsRepository;

  private constructor() {}

  static getInstance(): TipsRepository {
    if (!TipsRepository.instance) {
      TipsRepository.instance = new TipsRepository();
    }
    return TipsRepository.instance;
  }

  async getTip(id: string, tx?: Transaction): Promise<Tip | undefined> {
    const invoker = tx ?? db;
    return invoker.query.tips.findFirst({ where: eq(tips.id, id) });
  }

  async getTipsByCompany(
    companyId: string,
    filters?: {
      branchId?: string;
      staffProfileId?: string;
      distributionStatus?: Tip['distributionStatus'];
      paymentStatus?: Tip['paymentStatus'];
      startDate?: Date;
      endDate?: Date;
    },
    tx?: Transaction
  ): Promise<Tip[]> {
    const invoker = tx ?? db;
    const conditions = [eq(tips.companyId, companyId)];

    if (filters?.branchId) {
      conditions.push(eq(tips.branchId, filters.branchId));
    }
    if (filters?.staffProfileId) {
      conditions.push(eq(tips.staffProfileId, filters.staffProfileId));
    }
    if (filters?.distributionStatus) {
      conditions.push(eq(tips.distributionStatus, filters.distributionStatus));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(tips.paymentStatus, filters.paymentStatus));
    }
    if (filters?.startDate) {
      conditions.push(gte(tips.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(tips.createdAt, filters.endDate));
    }

    return invoker.query.tips.findMany({
      where: and(...conditions),
      orderBy: (tips, { desc }) => [desc(tips.createdAt)],
    });
  }

  async getTipsByStaffProfile(
    staffProfileId: string,
    tx?: Transaction
  ): Promise<Tip[]> {
    const invoker = tx ?? db;
    return invoker.query.tips.findMany({
      where: eq(tips.staffProfileId, staffProfileId),
      orderBy: (tips, { desc }) => [desc(tips.createdAt)],
    });
  }

  async getPendingTipsByCompany(
    companyId: string,
    branchId?: string,
    tx?: Transaction
  ): Promise<Tip[]> {
    const invoker = tx ?? db;
    const conditions = [
      eq(tips.companyId, companyId),
      eq(tips.distributionStatus, 'PENDING'),
      eq(tips.paymentStatus, 'SUCCEEDED'),
    ];

    if (branchId) {
      conditions.push(eq(tips.branchId, branchId));
    }

    return invoker.query.tips.findMany({
      where: and(...conditions),
      orderBy: (tips, { desc }) => [desc(tips.createdAt)],
    });
  }

  async createTip(input: CreateTip, tx?: Transaction): Promise<Tip> {
    const invoker = tx ?? db;
    const [created] = await invoker.insert(tips).values(input).returning();

    if (!created) throw new Error('Cannot create tip');

    return created;
  }

  async updateTip(id: string, updates: UpdateTip, tx?: Transaction): Promise<Tip> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(tips)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tips.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update tip');

    return updated;
  }

  async markTipsAsPaid(
    tipIds: string[],
    tx?: Transaction
  ): Promise<Tip[]> {
    const invoker = tx ?? db;
    const updated = await Promise.all(
      tipIds.map((id) =>
        invoker
          .update(tips)
          .set({ distributionStatus: 'PAID', updatedAt: new Date() })
          .where(eq(tips.id, id))
          .returning()
      )
    );

    return updated.flat();
  }

  /**
   * Get tips with branch and staff names joined in a single query
   * This avoids N+1 queries by fetching all related data in one go
   */
  async getTipsWithRelations(
    companyId: string,
    filters?: {
      branchId?: string;
      staffProfileId?: string;
      distributionStatus?: Tip['distributionStatus'];
      paymentStatus?: Tip['paymentStatus'];
      startDate?: Date;
      endDate?: Date;
    },
    tx?: Transaction
  ): Promise<Array<Tip & { branchName: string; staffName: string }>> {
    const invoker = tx ?? db;
    const conditions = [eq(tips.companyId, companyId)];

    if (filters?.branchId) {
      conditions.push(eq(tips.branchId, filters.branchId));
    }
    if (filters?.staffProfileId) {
      conditions.push(eq(tips.staffProfileId, filters.staffProfileId));
    }
    if (filters?.distributionStatus) {
      conditions.push(eq(tips.distributionStatus, filters.distributionStatus));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(tips.paymentStatus, filters.paymentStatus));
    }
    if (filters?.startDate) {
      conditions.push(gte(tips.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(tips.createdAt, filters.endDate));
    }

    const result = await invoker
      .select({
        // Tip fields
        id: tips.id,
        companyId: tips.companyId,
        branchId: tips.branchId,
        staffProfileId: tips.staffProfileId,
        amount: tips.amount,
        paymentStatus: tips.paymentStatus,
        distributionStatus: tips.distributionStatus,
        paymentProvider: tips.paymentProvider,
        paymentProviderTransactionId: tips.paymentProviderTransactionId,
        customerNote: tips.customerNote,
        customerRating: tips.customerRating,
        createdAt: tips.createdAt,
        updatedAt: tips.updatedAt,
        // Joined fields
        branchName: branches.name,
        staffName: staffProfiles.displayName,
      })
      .from(tips)
      .leftJoin(branches, eq(tips.branchId, branches.id))
      .leftJoin(staffProfiles, eq(tips.staffProfileId, staffProfiles.id))
      .where(and(...conditions))
      .orderBy(desc(tips.createdAt));

    return result.map((row) => ({
      id: row.id,
      companyId: row.companyId,
      branchId: row.branchId,
      staffProfileId: row.staffProfileId,
      amount: row.amount,
      paymentStatus: row.paymentStatus as Tip['paymentStatus'],
      distributionStatus: row.distributionStatus as Tip['distributionStatus'],
      paymentProvider: row.paymentProvider as Tip['paymentProvider'],
      paymentProviderTransactionId: row.paymentProviderTransactionId,
      customerNote: row.customerNote,
      customerRating: row.customerRating,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      branchName: row.branchName || 'Unknown',
      staffName: row.staffName || 'Unknown',
    }));
  }
}

