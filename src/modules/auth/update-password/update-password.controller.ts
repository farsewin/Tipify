import { z } from 'zod';
import { updatePasswordUseCase } from './update-password.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z
  .object({
    userId: z.string(),
    currentPassword: z.string().min(8).max(255),
    newPassword: z.string().min(8).max(255),
    confirmPassword: z.string().min(8).max(255),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'New passwords do not match',
        path: ['newPassword'],
      });
    }
  });

export async function updatePasswordController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<void> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'updatePassword Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        await updatePasswordUseCase({
          userId: data.userId,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







