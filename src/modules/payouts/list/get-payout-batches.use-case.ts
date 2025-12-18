import { getPayoutBatchesRepository } from '@/src/service-locator';
import type { PayoutBatch } from '@/src/modules/payouts/payout-batch.model';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function getPayoutBatchesUseCase(input: {
  companyId: string;
  sessionId: string;
}): Promise<PayoutBatch[]> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  const payoutBatchesRepository = getPayoutBatchesRepository();

  return payoutBatchesRepository.getPayoutBatchesByCompany(input.companyId);
}







