import { eq } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { payoutItems } from '@/drizzle/schema';
import type {
  CreatePayoutItem,
  PayoutItem,
} from '@/src/models/payout-item.model';

export class PayoutItemsRepository {
  private static instance: PayoutItemsRepository;

  private constructor() {}

  static getInstance(): PayoutItemsRepository {
    if (!PayoutItemsRepository.instance) {
      PayoutItemsRepository.instance = new PayoutItemsRepository();
    }
    return PayoutItemsRepository.instance;
  }

  async getPayoutItem(
    id: string,
    tx?: Transaction
  ): Promise<PayoutItem | undefined> {
    const invoker = tx ?? db;
    return invoker.query.payoutItems.findFirst({ where: eq(payoutItems.id, id) });
  }

  async getPayoutItemsByBatch(
    payoutBatchId: string,
    tx?: Transaction
  ): Promise<PayoutItem[]> {
    const invoker = tx ?? db;
    return invoker.query.payoutItems.findMany({
      where: eq(payoutItems.payoutBatchId, payoutBatchId),
    });
  }

  async createPayoutItem(
    input: CreatePayoutItem,
    tx?: Transaction
  ): Promise<PayoutItem> {
    const invoker = tx ?? db;
    const [created] = await invoker.insert(payoutItems).values(input).returning();

    if (!created) throw new Error('Cannot create payout item');

    return created;
  }

  async createPayoutItems(
    inputs: CreatePayoutItem[],
    tx?: Transaction
  ): Promise<PayoutItem[]> {
    const invoker = tx ?? db;
    const created = await invoker.insert(payoutItems).values(inputs).returning();

    return created;
  }
}

