import { z } from 'zod';
import { generateBranchQRUseCase } from './generate-branch-qr.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  sessionId: z.string().optional(),
  baseUrl: z.string().url(),
});

export async function generateBranchQRController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<{ url: string; dataUrl: string; svg: string }> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'generateBranchQR Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        return await generateBranchQRUseCase(data);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

