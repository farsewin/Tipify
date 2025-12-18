import { getTipsRepository } from '@/src/service-locator';
import type { Tip } from '@/src/modules/tips/tip.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';
import { getTransactionManagerService } from '@/src/service-locator';

export async function markTipsPaidUseCase(input: {
  companyId: string;
  tipIds: string[];
  sessionId: string;
}): Promise<Tip[]> {
  // Validate company access (requires at least ADMIN role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'ADMIN');

  if (input.tipIds.length === 0) {
    return [];
  }

  const tipsRepository = getTipsRepository();
  const transactionService = getTransactionManagerService();

  // Verify all tips belong to company and are in PENDING status
  const tips = await tipsRepository.getTipsByCompany(input.companyId, {
    distributionStatus: 'PENDING',
    paymentStatus: 'SUCCEEDED',
  });

  const validTipIds = tips
    .filter((tip) => input.tipIds.includes(tip.id))
    .map((tip) => tip.id);

  if (validTipIds.length === 0) {
    throw new NotFoundError('No valid tips found to mark as paid');
  }

  // Mark tips as paid in transaction
  const updatedTips = await transactionService.startTransaction(async (tx) => {
    return tipsRepository.markTipsAsPaid(validTipIds, tx);
  });

  return updatedTips;
}

