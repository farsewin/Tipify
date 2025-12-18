import type { Cookie } from '@/src/modules/shared/models/cookie';
import type { Session } from '@/src/modules/shared/models/session';
import { AuthenticationError } from '@/src/modules/shared/errors/auth';

import {
  getUsersRepository,
  getAuthenticationService,
} from '@/src/service-locator';

export async function signInUseCase(input: {
  email: string;
  password: string;
}): Promise<{ session: Session; cookie: Cookie }> {
  const usersRepository = getUsersRepository();
  const authenticationService = getAuthenticationService();

  const existingUser = await usersRepository.getUserByEmail(input.email);

  if (!existingUser) {
    throw new AuthenticationError('User does not exist');
  }

  const validPassword = await authenticationService.validatePasswords(
    input.password,
    existingUser.password_hash
  );

  if (!validPassword) {
    throw new AuthenticationError('Incorrect email or password');
  }

  return authenticationService.createSession(existingUser);
}
