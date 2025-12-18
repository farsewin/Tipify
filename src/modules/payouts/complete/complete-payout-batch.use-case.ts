import {
  getPayoutBatchesRepository,
} from '@/src/service-locator';
import type { PayoutBatch } from '@/src/modules/payouts/payout-batch.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';
import { getTransactionManagerService } from '@/src/service-locator';

export async function completePayoutBatchUseCase(input: {
  payoutBatchId: string;
  companyId: string;
  sessionId: string;
}): Promise<PayoutBatch> {
  // Validate company access (requires ADMIN role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'ADMIN');

  const payoutBatchesRepository = getPayoutBatchesRepository();
  const payoutBatch = await payoutBatchesRepository.getPayoutBatch(input.payoutBatchId);

  if (!payoutBatch) {
    throw new NotFoundError('Payout batch not found');
  }

  // Verify batch belongs to company
  if (payoutBatch.companyId !== input.companyId) {
    throw new NotFoundError('Payout batch not found');
  }

  // Verify batch is in PENDING status
  if (payoutBatch.status !== 'PENDING') {
    throw new Error('Payout batch is already completed');
  }

  // Mark batch as completed
  const transactionService = getTransactionManagerService();
  const updated = await transactionService.startTransaction(async (tx) => {
    return payoutBatchesRepository.markPayoutBatchAsCompleted(input.payoutBatchId, tx);
  });

  return updated;
}







