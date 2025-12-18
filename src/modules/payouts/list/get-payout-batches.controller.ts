import { z } from 'zod';
import { getPayoutBatchesUseCase } from './get-payout-batches.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { PayoutBatch } from '@/src/modules/payouts/payout-batch.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  sessionId: z.string().optional(),
});

function presenter(payoutBatches: PayoutBatch[]) {
  return payoutBatches.map((batch) => ({
    id: batch.id,
    companyId: batch.companyId,
    branchId: batch.branchId,
    processedByUserId: batch.processedByUserId,
    payoutDate: batch.payoutDate,
    totalAmount: batch.totalAmount,
    currency: batch.currency,
    status: batch.status,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  }));
}

export async function getPayoutBatchesController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getPayoutBatches Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const payoutBatches = await getPayoutBatchesUseCase({
          companyId: data.companyId,
          sessionId: data.sessionId,
        });

        return presenter(payoutBatches);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







