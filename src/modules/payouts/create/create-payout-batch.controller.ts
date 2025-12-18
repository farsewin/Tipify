import { z } from 'zod';
import { createPayoutBatchUseCase } from './create-payout-batch.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { PayoutBatch, PayoutItem } from '@/src/modules/payouts/payout-batch.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  branchId: z.string().optional(),
  processedByUserId: z.string(),
  payoutDate: z.date(),
  tipIds: z.array(z.string()).min(1),
  sessionId: z.string(),
});

function presenter(result: { payoutBatch: PayoutBatch; payoutItems: PayoutItem[] }) {
  return {
    payoutBatch: {
      id: result.payoutBatch.id,
      companyId: result.payoutBatch.companyId,
      branchId: result.payoutBatch.branchId,
      payoutDate: result.payoutBatch.payoutDate,
      totalAmount: result.payoutBatch.totalAmount,
      currency: result.payoutBatch.currency,
      status: result.payoutBatch.status,
      createdAt: result.payoutBatch.createdAt,
    },
    payoutItems: result.payoutItems.map((item) => ({
      id: item.id,
      staffProfileId: item.staffProfileId,
      amount: item.amount,
      currency: item.currency,
    })),
  };
}

export async function createPayoutBatchController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'createPayoutBatch Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const result = await createPayoutBatchUseCase(data);

        return presenter(result);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







