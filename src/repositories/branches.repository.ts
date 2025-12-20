import { and, eq } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { branches } from '@/drizzle/schema';
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
}

