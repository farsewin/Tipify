import { z } from 'zod';
import { getTipsUseCase } from './get-tips.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Tip } from '@/src/modules/tips/tip.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  branchId: z.string().optional(),
  staffProfileId: z.string().optional(),
  distributionStatus: z.enum(['PENDING', 'PAID']).optional(),
  paymentStatus: z.enum(['SUCCEEDED', 'PENDING', 'FAILED']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sessionId: z.string().optional(),
});

function presenter(tips: Tip[]) {
  return tips.map((tip) => ({
    id: tip.id,
    companyId: tip.companyId,
    branchId: tip.branchId,
    staffProfileId: tip.staffProfileId,
    amount: tip.amount,
    currency: tip.currency,
    paymentStatus: tip.paymentStatus,
    distributionStatus: tip.distributionStatus,
    paymentProvider: tip.paymentProvider,
    customerNote: tip.customerNote,
    customerRating: tip.customerRating,
    createdAt: tip.createdAt,
    updatedAt: tip.updatedAt,
  }));
}

export async function getTipsController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getTips Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const tips = await getTipsUseCase({
          companyId: data.companyId,
          branchId: data.branchId,
          staffProfileId: data.staffProfileId,
          distributionStatus: data.distributionStatus,
          paymentStatus: data.paymentStatus,
          startDate: data.startDate,
          endDate: data.endDate,
          sessionId: data.sessionId,
        });

        return presenter(tips);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

