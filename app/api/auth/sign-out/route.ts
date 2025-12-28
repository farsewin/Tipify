import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { auth } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  console.log('🔐 [SignOut API] Sign-out request received');

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  try {
    if (!sessionToken) {
      console.log(
        '⚠️ [SignOut API] No session token found, redirecting to sign-in'
      );
      return NextResponse.json({ success: true, redirect: '/sign-in' });
    }

    console.log('🔐 [SignOut API] Calling Better Auth sign-out...');

    // Use Better Auth's sign-out API
    await auth.api.signOut({
      headers: request.headers,
    });

    console.log('✅ [SignOut API] Better Auth sign-out successful');

    // Clear the session cookie
    const response = NextResponse.json({ success: true, redirect: '/sign-in' });
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    console.log('✅ [SignOut API] Session cookie cleared');
    return response;
  } catch (err) {
    console.error('❌ [SignOut API] Error:', err);

    // Even on error, clear the cookie and redirect
    const response = NextResponse.json({ success: true, redirect: '/sign-in' });
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  }
}
