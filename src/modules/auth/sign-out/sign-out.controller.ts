import { signOutUseCase } from './sign-out.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import { Cookie } from '@/src/modules/shared/models/cookie';

import {
  getInstrumentationService,
  getCrashReporterService,
  getAuthenticationService,
} from '@/src/service-locator';

export async function signOutController(
  sessionId: string | undefined
): Promise<Cookie> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'signOut Controller' },
    async () => {
      try {
        if (!sessionId) {
          throw new InputParseError('Must provide a session ID');
        }

        // Validate session exists
        const authService = getAuthenticationService();
        const { session } = await authService.validateSession(sessionId);

        // Sign out
        const { blankCookie } = await signOutUseCase(session.id);

        return blankCookie;
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}
