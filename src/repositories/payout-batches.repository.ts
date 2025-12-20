import { and, eq } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { payoutBatches } from '@/drizzle/schema';
import type {
  CreatePayoutBatch,
  PayoutBatch,
} from '@/src/models/payout-batch.model';

export class PayoutBatchesRepository {
  private static instance: PayoutBatchesRepository;

  private constructor() {}

  static getInstance(): PayoutBatchesRepository {
    if (!PayoutBatchesRepository.instance) {
      PayoutBatchesRepository.instance = new PayoutBatchesRepository();
    }
    return PayoutBatchesRepository.instance;
  }

  async getPayoutBatch(
    id: string,
    tx?: Transaction
  ): Promise<PayoutBatch | undefined> {
    const invoker = tx ?? db;
    return invoker.query.payoutBatches.findFirst({
      where: eq(payoutBatches.id, id),
    });
  }

  async getPayoutBatchesByCompany(
    companyId: string,
    tx?: Transaction
  ): Promise<PayoutBatch[]> {
    const invoker = tx ?? db;
    return invoker.query.payoutBatches.findMany({
      where: eq(payoutBatches.companyId, companyId),
      orderBy: (payoutBatches, { desc }) => [desc(payoutBatches.createdAt)],
    });
  }

  async createPayoutBatch(
    input: CreatePayoutBatch,
    tx?: Transaction
  ): Promise<PayoutBatch> {
    const invoker = tx ?? db;
    const [created] = await invoker.insert(payoutBatches).values(input).returning();

    if (!created) throw new Error('Cannot create payout batch');

    return created;
  }

  async markPayoutBatchAsCompleted(
    id: string,
    tx?: Transaction
  ): Promise<PayoutBatch> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(payoutBatches)
      .set({ status: 'COMPLETED', updatedAt: new Date() })
      .where(eq(payoutBatches.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update payout batch');

    return updated;
  }
}

