import { z } from 'zod';

import { signInUseCase } from './sign-in.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Cookie } from '@/src/modules/shared/models/cookie';

import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

export async function signInController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<Cookie> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    {
      name: 'signIn Controller',
      op: 'controller',
      attributes: { email: input.email },
    },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const { cookie } = await signInUseCase(data);

        return cookie;
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}
