import { z } from 'zod';
import { createTipUseCase } from './create-tip.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Tip } from '@/src/modules/tips/tip.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  staffProfileId: z.string(),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  paymentProviderTransactionId: z.string(),
  customerNote: z.string().max(500).optional(),
  customerRating: z.number().int().min(1).max(5).optional(),
});

function presenter(tip: Tip) {
  return {
    id: tip.id,
    companyId: tip.companyId,
    branchId: tip.branchId,
    staffProfileId: tip.staffProfileId,
    amount: tip.amount,
    currency: tip.currency,
    paymentStatus: tip.paymentStatus,
    distributionStatus: tip.distributionStatus,
    paymentProviderTransactionId: tip.paymentProviderTransactionId,
    customerNote: tip.customerNote,
    customerRating: tip.customerRating,
    createdAt: tip.createdAt,
  };
}

export async function createTipController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'createTip Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const tip = await createTipUseCase(data);

        return presenter(tip);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

