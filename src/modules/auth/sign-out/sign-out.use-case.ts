import { Cookie } from '@/src/modules/shared/models/cookie';

import { getAuthenticationService } from '@/src/service-locator';

export async function signOutUseCase(
  sessionId: string
): Promise<{ blankCookie: Cookie }> {
  const authenticationService = getAuthenticationService();
  return authenticationService.invalidateSession(sessionId);
}
