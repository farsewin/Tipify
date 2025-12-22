import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { getAuthenticationService } from '@/src/service-locator';
import { InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError } from '@/src/shared/errors/auth';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  try {
    if (!sessionId) {
      return NextResponse.json({ success: true, redirect: '/sign-in' });
    }

    const authService = getAuthenticationService();
    const { session } = await authService.validateSession(sessionId);

    const { blankCookie } = await authService.invalidateSession(session.id);
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

    return NextResponse.json({ success: true, redirect: '/sign-in' });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof InputParseError) {
      return NextResponse.json({ success: true, redirect: '/sign-in' });
    }

    console.error('Sign out error:', err);
    return NextResponse.json(
      { error: 'An error happened during sign out.' },
      { status: 500 }
    );
  }
}

