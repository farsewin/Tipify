import { z } from 'zod';
import { completePayoutBatchUseCase } from './complete-payout-batch.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { PayoutBatch } from '@/src/modules/payouts/payout-batch.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  payoutBatchId: z.string(),
  companyId: z.string(),
  sessionId: z.string(),
});

function presenter(payoutBatch: PayoutBatch) {
  return {
    id: payoutBatch.id,
    status: payoutBatch.status,
    updatedAt: payoutBatch.updatedAt,
  };
}

export async function completePayoutBatchController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'completePayoutBatch Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const payoutBatch = await completePayoutBatchUseCase(data);

        return presenter(payoutBatch);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







