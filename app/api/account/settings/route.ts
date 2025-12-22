import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/config';
import { getUsersRepository, getAuthenticationService } from '@/src/service-locator';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import { InputParseError } from '@/src/shared/errors/common';

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
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
    const data = updateAccountSchema.parse(body);

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const usersRepository = getUsersRepository();
    await usersRepository.updateUser(user.id, {
      name: data.name,
      email: data.email,
    });

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

    console.error('Update account settings error:', err);
    return NextResponse.json(
      { error: 'An error happened while updating account settings. Please try again later.' },
      { status: 500 }
    );
  }
}

