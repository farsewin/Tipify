import {
  getPayoutBatchesRepository,
  getPayoutItemsRepository,
} from '@/src/service-locator';
import type { PayoutBatch, PayoutItem } from '@/src/modules/payouts/payout-batch.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function getPayoutBatchDetailsUseCase(input: {
  payoutBatchId: string;
  companyId: string;
  sessionId: string;
}): Promise<{ payoutBatch: PayoutBatch; payoutItems: PayoutItem[] }> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  const payoutBatchesRepository = getPayoutBatchesRepository();
  const payoutBatch = await payoutBatchesRepository.getPayoutBatch(input.payoutBatchId);

  if (!payoutBatch) {
    throw new NotFoundError('Payout batch not found');
  }

  // Verify batch belongs to company
  if (payoutBatch.companyId !== input.companyId) {
    throw new NotFoundError('Payout batch not found');
  }

  const payoutItemsRepository = getPayoutItemsRepository();
  const payoutItems = await payoutItemsRepository.getPayoutItemsByBatch(input.payoutBatchId);

  return { payoutBatch, payoutItems };
}







