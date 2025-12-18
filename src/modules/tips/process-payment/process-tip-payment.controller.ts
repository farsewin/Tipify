import { z } from 'zod';
import { processTipPaymentUseCase } from './process-tip-payment.use-case';
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
  customerNote: z.string().max(500).optional(),
  customerRating: z.number().int().min(1).max(5).optional(),
});

function presenter(result: { tip: Tip; paymentResponse: any }) {
  return {
    tip: {
      id: result.tip.id,
      amount: result.tip.amount,
      currency: result.tip.currency,
      paymentStatus: result.tip.paymentStatus,
      paymentProviderTransactionId: result.tip.paymentProviderTransactionId,
    },
    paymentResponse: {
      success: result.paymentResponse.success,
      transactionId: result.paymentResponse.transactionId,
      status: result.paymentResponse.status,
    },
  };
}

export async function processTipPaymentController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'processTipPayment Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const result = await processTipPaymentUseCase(data);

        return presenter(result);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

