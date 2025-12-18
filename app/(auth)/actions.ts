'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { signUpController } from '@/src/modules/auth/sign-up/sign-up.controller';
import { signInController } from '@/src/modules/auth/sign-in/sign-in.controller';
import { signOutController } from '@/src/modules/auth/sign-out/sign-out.controller';
import { Cookie } from '@/src/modules/shared/models/cookie';
import { SESSION_COOKIE } from '@/config';
import { InputParseError } from '@/src/modules/shared/errors/common';
import {
  AuthenticationError,
  UnauthenticatedError,
} from '@/src/modules/shared/errors/auth';
import { getDashboardRedirect } from '@/src/modules/shared/helpers/access-control';

export async function signUp(formData: FormData) {
  const name = formData.get('name')?.toString();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirm_password')?.toString();
  const companyName = formData.get('company_name')?.toString();
  const companyLegalName = formData.get('company_legal_name')?.toString();
  const country = formData.get('country')?.toString();
  const currency = formData.get('currency')?.toString();

  let sessionId: string | undefined;
  try {
    const { cookie } = await signUpController({
      name,
      email,
      password,
      confirm_password: confirmPassword,
      companyName,
      companyLegalName,
      country,
      currency,
    });

    sessionId = cookie.value;
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.attributes);
  } catch (err) {
    if (err instanceof InputParseError) {
      return {
        error: 'Invalid data. Make sure the Password and Confirm Password match.',
      };
    }
    if (err instanceof AuthenticationError) {
      return { error: err.message };
    }
    console.error('Sign up error:', err);
    return {
      error: 'An error happened. Please try again later.',
    };
  }

  // Redirect based on user type (new sign-ups are company owners, so go to company dashboard)
  redirect('/app/dashboard');
}


export async function signIn(formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  let cookie;
  try {
    cookie = await signInController({ email, password });
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.attributes);
  } catch (err) {
    if (err instanceof InputParseError || err instanceof AuthenticationError) {
      return { error: 'Incorrect email or password' };
    }
    console.error('Sign in error:', err);
    return { error: 'An error happened. Please try again later.' };
  }

  // Get dashboard path based on user type
  // Note: We need to use the session ID (cookie.value) to determine user type
  let dashboardPath = '/app/dashboard'; // default
  try {
    dashboardPath = await getDashboardRedirect(cookie.value);
  } catch (err) {
    // If we can't determine user type, log the error and default to company dashboard
    // The layout will handle redirecting staff members to the correct dashboard
    console.error('Error determining dashboard redirect:', err);
    dashboardPath = '/app/dashboard';
  }

  // redirect() throws a special error that Next.js handles - don't catch it
  redirect(dashboardPath);
}

export async function signOut() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  try {
    const blankCookie = await signOutController(sessionId);
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof InputParseError) {
      redirect('/sign-in');
    }

    console.error('Sign out error:', err);
    throw err;
  }

  redirect('/sign-in');
}
