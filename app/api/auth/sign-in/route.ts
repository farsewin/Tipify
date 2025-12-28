import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/src/lib/auth';
import { getDashboardRedirect } from '@/src/shared/helpers/access-control';
import { headers } from 'next/headers';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

export async function POST(request: NextRequest) {
  console.log('🔐 [SignIn API] Sign-in request received');

  try {
    const body = await request.json();
    console.log('🔐 [SignIn API] Request body parsed');
    console.log('🔐 [SignIn API] Email:', body.email);

    const data = signInSchema.parse(body);
    console.log('🔐 [SignIn API] Validation passed');

    // Use Better Auth's sign-in API
    console.log('🔐 [SignIn API] Calling Better Auth signIn.email...');

    const result = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });

    console.log(
      '🔐 [SignIn API] Better Auth result:',
      result ? 'success' : 'failed'
    );

    if (!result || !result.user) {
      console.log('❌ [SignIn API] Sign-in failed - no user returned');
      return NextResponse.json(
        { error: 'Incorrect email or password' },
        { status: 401 }
      );
    }

    console.log('✅ [SignIn API] User authenticated:', result.user.id);

    // Determine dashboard redirect based on user type
    let dashboardPath = '/app/dashboard';
    try {
      // Get session token for redirect determination
      const sessionToken = result.session?.token;
      if (sessionToken) {
        console.log('🔐 [SignIn API] Determining dashboard redirect...');
        dashboardPath = await getDashboardRedirect(sessionToken);
        console.log('🔐 [SignIn API] Dashboard redirect:', dashboardPath);
      }
    } catch (err) {
      console.error(
        '⚠️ [SignIn API] Error determining dashboard redirect:',
        err
      );
      dashboardPath = '/app/dashboard';
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      redirect: dashboardPath,
    });

    // Set the session cookie (Better Auth handles this internally, but we ensure it's set)
    if (result.session?.token) {
      console.log('🔐 [SignIn API] Setting session cookie...');
      response.cookies.set('better-auth.session_token', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    console.log(
      '✅ [SignIn API] Sign-in successful, redirecting to:',
      dashboardPath
    );
    return response;
  } catch (err) {
    console.error('❌ [SignIn API] Error:', err);

    if (err instanceof z.ZodError) {
      console.log('❌ [SignIn API] Validation error:', err.issues);
      return NextResponse.json(
        { error: err.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Check for Better Auth errors
    if (err instanceof Error) {
      if (
        err.message.includes('Invalid credentials') ||
        err.message.includes('User not found')
      ) {
        return NextResponse.json(
          { error: 'Incorrect email or password' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An error happened. Please try again later.' },
      { status: 500 }
    );
  }
}
