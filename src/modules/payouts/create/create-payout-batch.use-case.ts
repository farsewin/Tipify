import { generateIdFromEntropySize } from 'lucia';
import {
  getTipsRepository,
  getPayoutBatchesRepository,
  getPayoutItemsRepository,
  getCompaniesRepository,
} from '@/src/service-locator';
import type { PayoutBatch, PayoutItem } from '@/src/modules/payouts/payout-batch.model';
import { InputParseError, NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';
import { getTransactionManagerService } from '@/src/service-locator';

export async function createPayoutBatchUseCase(input: {
  companyId: string;
  branchId?: string;
  processedByUserId: string;
  payoutDate: Date;
  tipIds: string[]; // Tips to include in this batch
  sessionId: string;
}): Promise<{ payoutBatch: PayoutBatch; payoutItems: PayoutItem[] }> {
  // Validate company access (requires ADMIN role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'ADMIN');

  if (input.tipIds.length === 0) {
    throw new InputParseError('At least one tip must be selected');
  }

  // Verify company exists
  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  const tipsRepository = getTipsRepository();
  const transactionService = getTransactionManagerService();

  // Get pending tips for the company
  const pendingTips = await tipsRepository.getPendingTipsByCompany(
    input.companyId,
    input.branchId
  );

  // Filter to only include requested tip IDs that are actually pending
  const validTipIds = pendingTips
    .filter((tip) => input.tipIds.includes(tip.id))
    .map((tip) => tip.id);

  if (validTipIds.length === 0) {
    throw new InputParseError('No valid pending tips found');
  }

  // Group tips by staff member and calculate totals
  const staffTotals = new Map<string, { amount: number; tipIds: string[] }>();

  for (const tip of pendingTips) {
    if (validTipIds.includes(tip.id)) {
      const existing = staffTotals.get(tip.staffProfileId) || {
        amount: 0,
        tipIds: [],
      };
      existing.amount += tip.amount;
      existing.tipIds.push(tip.id);
      staffTotals.set(tip.staffProfileId, existing);
    }
  }

  // Create payout batch and items in a transaction
  const result = await transactionService.startTransaction(async (tx) => {
    // Calculate total amount
    const totalAmount = Array.from(staffTotals.values()).reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // Create payout batch
    const payoutBatchesRepository = getPayoutBatchesRepository();
    const payoutBatchId = generateIdFromEntropySize(10);

    const payoutBatch = await payoutBatchesRepository.createPayoutBatch(
      {
        id: payoutBatchId,
        companyId: input.companyId,
        branchId: input.branchId || null,
        processedByUserId: input.processedByUserId,
        payoutDate: input.payoutDate,
        totalAmount,
        currency: company.currency,
      },
      tx
    );

    // Create payout items and mark tips as paid
    const payoutItemsRepository = getPayoutItemsRepository();
    const payoutItems: PayoutItem[] = [];

    for (const [staffProfileId, totals] of staffTotals.entries()) {
      const payoutItemId = generateIdFromEntropySize(10);
      const payoutItem = await payoutItemsRepository.createPayoutItem(
        {
          id: payoutItemId,
          payoutBatchId: payoutBatch.id,
          staffProfileId,
          amount: totals.amount,
          currency: company.currency,
        },
        tx
      );
      payoutItems.push(payoutItem);
    }

    // Mark all tips as paid
    await tipsRepository.markTipsAsPaid(validTipIds, tx);

    return { payoutBatch, payoutItems };
  });

  return result;
}







