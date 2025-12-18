import { z } from 'zod';
import { markTipsPaidUseCase } from './mark-tips-paid.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Tip } from '@/src/modules/tips/tip.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  tipIds: z.array(z.string()).min(1),
  sessionId: z.string(),
});

function presenter(tips: Tip[]) {
  return tips.map((tip) => ({
    id: tip.id,
    distributionStatus: tip.distributionStatus,
    updatedAt: tip.updatedAt,
  }));
}

export async function markTipsPaidController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'markTipsPaid Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const tips = await markTipsPaidUseCase(data);

        return presenter(tips);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

