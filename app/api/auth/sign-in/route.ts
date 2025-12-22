import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getUsersRepository, getAuthenticationService } from '@/src/service-locator';
import { getDashboardRedirect } from '@/src/shared/helpers/access-control';
import { InputParseError } from '@/src/shared/errors/common';
import { AuthenticationError } from '@/src/shared/errors/auth';
import { SESSION_COOKIE } from '@/config';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = signInSchema.parse(body);

    const usersRepository = getUsersRepository();
    const authenticationService = getAuthenticationService();

    const existingUser = await usersRepository.getUserByEmail(data.email);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Incorrect email or password' },
        { status: 401 }
      );
    }

    const validPassword = await authenticationService.validatePasswords(
      data.password,
      existingUser.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Incorrect email or password' },
        { status: 401 }
      );
    }

    const { cookie } = await authenticationService.createSession(existingUser);
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.attributes);

    let dashboardPath = '/app/dashboard';
    try {
      dashboardPath = await getDashboardRedirect(cookie.value);
    } catch (err) {
      console.error('Error determining dashboard redirect:', err);
      dashboardPath = '/app/dashboard';
    }

    return NextResponse.json({ success: true, redirect: dashboardPath });
  } catch (err) {
    console.error('Sign in error:', err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    if (err instanceof InputParseError || err instanceof AuthenticationError) {
      return NextResponse.json(
        { error: 'Incorrect email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'An error happened. Please try again later.' },
      { status: 500 }
    );
  }
}

