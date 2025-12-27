import { and, eq, sql, gte, lte } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { branches, staffProfiles, tips } from '@/drizzle/schema';
import type { Branch, CreateBranch, UpdateBranch } from '@/src/models/branch.model';

export class BranchesRepository {
  private static instance: BranchesRepository;

  private constructor() {}

  static getInstance(): BranchesRepository {
    if (!BranchesRepository.instance) {
      BranchesRepository.instance = new BranchesRepository();
    }
    return BranchesRepository.instance;
  }

  async getBranch(id: string, tx?: Transaction): Promise<Branch | undefined> {
    const invoker = tx ?? db;
    return invoker.query.branches.findFirst({ where: eq(branches.id, id) });
  }

  async getBranchBySlugAndCompany(
    slug: string,
    companyId: string,
    tx?: Transaction
  ): Promise<Branch | undefined> {
    const invoker = tx ?? db;
    return invoker.query.branches.findFirst({
      where: and(eq(branches.slug, slug), eq(branches.companyId, companyId)),
    });
  }

  async getBranchesByCompany(
    companyId: string,
    tx?: Transaction
  ): Promise<Branch[]> {
    const invoker = tx ?? db;
    return invoker.query.branches.findMany({
      where: eq(branches.companyId, companyId),
    });
  }

  async getActiveBranchesByCompany(
    companyId: string,
    tx?: Transaction
  ): Promise<Branch[]> {
    const invoker = tx ?? db;
    return invoker.query.branches.findMany({
      where: and(eq(branches.companyId, companyId), eq(branches.active, true)),
    });
  }

  async createBranch(input: CreateBranch, tx?: Transaction): Promise<Branch> {
    const invoker = tx ?? db;
    const [created] = await invoker.insert(branches).values(input).returning();

    if (!created) throw new Error('Cannot create branch');

    return created;
  }

  async updateBranch(
    id: string,
    updates: UpdateBranch,
    tx?: Transaction
  ): Promise<Branch> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(branches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update branch');

    return updated;
  }

  async deleteBranch(id: string, tx?: Transaction): Promise<void> {
    const invoker = tx ?? db;
    await invoker.delete(branches).where(eq(branches.id, id));
  }

  /**
   * Get branches with aggregated metrics (staff count, tips count, totals, etc.)
   * This method uses SQL aggregations to avoid N+1 queries and in-memory filtering.
   */
  async getBranchesWithMetrics(
    companyId: string,
    startDate: Date,
    tx?: Transaction
  ): Promise<
    Array<
      Branch & {
        staffCount: number;
        tipsCount: number;
        totalTips: number;
        avgTip: number;
        recentTipsCount: number;
        recentAmount: number;
      }
    >
  > {
    const invoker = tx ?? db;

    // Calculate 7 days ago for recent tips
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Use two separate queries to avoid date parameterization issues in CASE statements
    // First: Get 30-day metrics (using WHERE clause for proper date handling)
    const branches30Day = await invoker
      .select({
        id: branches.id,
        companyId: branches.companyId,
        name: branches.name,
        location: branches.location,
        slug: branches.slug,
        active: branches.active,
        createdAt: branches.createdAt,
        updatedAt: branches.updatedAt,
        staffCount: sql<number>`COUNT(DISTINCT ${staffProfiles.id})::int`,
        tipsCount: sql<number>`COUNT(DISTINCT ${tips.id})::int`,
        totalTips: sql<number>`COALESCE(SUM(${tips.amount}), 0)::int`,
        avgTip: sql<number>`COALESCE(AVG(${tips.amount})::int, 0)`,
      })
      .from(branches)
      .leftJoin(staffProfiles, eq(branches.id, staffProfiles.branchId))
      .leftJoin(tips, and(
        eq(branches.id, tips.branchId),
        eq(tips.paymentStatus, 'SUCCEEDED'),
        gte(tips.createdAt, startDate)
      ))
      .where(eq(branches.companyId, companyId))
      .groupBy(
        branches.id,
        branches.companyId,
        branches.name,
        branches.location,
        branches.slug,
        branches.active,
        branches.createdAt,
        branches.updatedAt
      );

    // Second: Get 7-day metrics
    const branches7Day = await invoker
      .select({
        id: branches.id,
        recentTipsCount: sql<number>`COUNT(DISTINCT ${tips.id})::int`,
        recentAmount: sql<number>`COALESCE(SUM(${tips.amount}), 0)::int`,
      })
      .from(branches)
      .leftJoin(tips, and(
        eq(branches.id, tips.branchId),
        eq(tips.paymentStatus, 'SUCCEEDED'),
        gte(tips.createdAt, sevenDaysAgo)
      ))
      .where(eq(branches.companyId, companyId))
      .groupBy(branches.id);

    // Merge results
    const sevenDayMap = new Map(branches7Day.map(b => [b.id, b]));

    return branches30Day.map((branch) => {
      const sevenDayData = sevenDayMap.get(branch.id);
      return {
        id: branch.id,
        companyId: branch.companyId,
        name: branch.name,
        location: branch.location,
        slug: branch.slug,
        active: branch.active,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
        staffCount: branch.staffCount,
        tipsCount: branch.tipsCount,
        totalTips: branch.totalTips,
        avgTip: Math.round(branch.avgTip),
        recentTipsCount: sevenDayData?.recentTipsCount ?? 0,
        recentAmount: sevenDayData?.recentAmount ?? 0,
      };
    });

    return result.map((row) => ({
      id: row.id,
      companyId: row.companyId,
      name: row.name,
      location: row.location,
      slug: row.slug,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      staffCount: row.staffCount,
      tipsCount: row.tipsCount,
      totalTips: row.totalTips,
      avgTip: Math.round(row.avgTip),
      recentTipsCount: row.recentTipsCount,
      recentAmount: row.recentAmount,
    }));
  }
}

