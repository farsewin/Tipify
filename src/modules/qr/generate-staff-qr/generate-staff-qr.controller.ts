import { z } from 'zod';
import { generateStaffQRUseCase } from './generate-staff-qr.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  staffProfileId: z.string(),
  sessionId: z.string().optional(),
  baseUrl: z.string().url(),
});

export async function generateStaffQRController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<{ url: string; dataUrl: string; svg: string }> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'generateStaffQR Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        return await generateStaffQRUseCase(data);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

