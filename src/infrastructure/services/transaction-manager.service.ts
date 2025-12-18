import { db, Transaction } from '@/drizzle';

export class TransactionManagerService {
  private static instance: TransactionManagerService;

  private constructor() {}

  static getInstance(): TransactionManagerService {
    if (!TransactionManagerService.instance) {
      TransactionManagerService.instance = new TransactionManagerService();
    }
    return TransactionManagerService.instance;
  }

  public startTransaction<T>(
    clb: (tx: Transaction) => Promise<T>,
    parent?: Transaction
  ): Promise<T> {
    const invoker = parent ?? db;
    return invoker.transaction(clb);
  }
}
