import { z } from 'zod';
import { getPayoutBatchDetailsUseCase } from './get-payout-batch-details.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { PayoutBatch, PayoutItem } from '@/src/modules/payouts/payout-batch.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  payoutBatchId: z.string(),
  companyId: z.string(),
  sessionId: z.string().optional(),
});

function presenter(result: { payoutBatch: PayoutBatch; payoutItems: PayoutItem[] }) {
  return {
    payoutBatch: {
      id: result.payoutBatch.id,
      companyId: result.payoutBatch.companyId,
      branchId: result.payoutBatch.branchId,
      processedByUserId: result.payoutBatch.processedByUserId,
      payoutDate: result.payoutBatch.payoutDate,
      totalAmount: result.payoutBatch.totalAmount,
      currency: result.payoutBatch.currency,
      status: result.payoutBatch.status,
      createdAt: result.payoutBatch.createdAt,
      updatedAt: result.payoutBatch.updatedAt,
    },
    payoutItems: result.payoutItems.map((item) => ({
      id: item.id,
      staffProfileId: item.staffProfileId,
      amount: item.amount,
      currency: item.currency,
      createdAt: item.createdAt,
    })),
  };
}

export async function getPayoutBatchDetailsController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getPayoutBatchDetails Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const result = await getPayoutBatchDetailsUseCase({
          payoutBatchId: data.payoutBatchId,
          companyId: data.companyId,
          sessionId: data.sessionId,
        });

        return presenter(result);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







