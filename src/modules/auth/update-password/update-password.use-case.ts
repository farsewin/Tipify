import { hash } from 'bcrypt-ts';
import { getUsersRepository } from '@/src/service-locator';
import { getAuthenticationService } from '@/src/service-locator';
import { PASSWORD_SALT_ROUNDS } from '@/config';
import { InputParseError, NotFoundError } from '@/src/modules/shared/errors/common';

export async function updatePasswordUseCase(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  // Validate new password
  if (input.newPassword.length < 8 || input.newPassword.length > 255) {
    throw new InputParseError('Password must be between 8 and 255 characters');
  }

  const usersRepository = getUsersRepository();
  const authService = getAuthenticationService();

  // Get user
  const user = await usersRepository.getUser(input.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const validPassword = await authService.validatePasswords(
    input.currentPassword,
    user.password_hash
  );

  if (!validPassword) {
    throw new InputParseError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hash(input.newPassword, PASSWORD_SALT_ROUNDS);

  // Update password
  await usersRepository.updatePassword(input.userId, newPasswordHash);
}

