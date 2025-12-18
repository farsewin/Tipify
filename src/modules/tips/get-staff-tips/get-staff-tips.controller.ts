import { z } from 'zod';
import { getStaffTipsUseCase } from './get-staff-tips.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Tip } from '@/src/modules/tips/tip.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  staffProfileId: z.string(),
  sessionId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

function presenter(tips: Tip[]) {
  return tips.map((tip) => ({
    id: tip.id,
    amount: tip.amount,
    currency: tip.currency,
    paymentStatus: tip.paymentStatus,
    distributionStatus: tip.distributionStatus,
    customerNote: tip.customerNote,
    customerRating: tip.customerRating,
    createdAt: tip.createdAt,
  }));
}

export async function getStaffTipsController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getStaffTips Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const tips = await getStaffTipsUseCase(data);

        return presenter(tips);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







