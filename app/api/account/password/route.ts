import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { hash } from 'bcrypt-ts';
import { SESSION_COOKIE, PASSWORD_SALT_ROUNDS } from '@/config';
import { getUsersRepository, getAuthenticationService } from '@/src/service-locator';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';

const updatePasswordSchema = z
  .object({
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

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = updatePasswordSchema.parse(body);

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const usersRepository = getUsersRepository();
    const userRecord = await usersRepository.getUser(user.id);
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const validPassword = await authService.validatePasswords(
      data.currentPassword,
      userRecord.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hash(data.newPassword, PASSWORD_SALT_ROUNDS);
    await usersRepository.updatePassword(user.id, newPasswordHash);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }

    if (err instanceof InputParseError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    if (err instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    console.error('Update password error:', err);
    return NextResponse.json(
      { error: 'An error happened while updating password. Please try again later.' },
      { status: 500 }
    );
  }
}

