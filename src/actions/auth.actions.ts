'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateIdFromEntropySize } from 'lucia';
import { SESSION_COOKIE } from '@/config';
import { Cookie } from '@/src/shared/models/cookie';
import { InputParseError } from '@/src/shared/errors/common';
import {
  AuthenticationError,
  UnauthenticatedError,
} from '@/src/shared/errors/auth';
import { getDashboardRedirect } from '@/src/shared/helpers/access-control';
import {
  getUsersRepository,
  getCompaniesRepository,
  getCompanyMembersRepository,
  getAuthenticationService,
  getTransactionManagerService,
} from '@/src/service-locator';

// ============================================
// SCHEMAS
// ============================================

const signUpSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(8).max(255),
    confirmPassword: z.string().min(8).max(255),
    companyName: z.string().min(1).max(100),
    companyLegalName: z.string().max(200).optional(),
    country: z.string().length(2), // ISO country code
    currency: z.string().length(3), // ISO currency code
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'The passwords did not match',
        path: ['password'],
      });
      ctx.addIssue({
        code: 'custom',
        message: 'The passwords did not match',
        path: ['confirmPassword'],
      });
    }
  });

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

// ============================================
// HELPER: Check if error is Next.js redirect
// ============================================

function isRedirectError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message === 'NEXT_REDIRECT' ||
      err.message.includes('NEXT_REDIRECT'))
  );
}

// ============================================
// SIGN UP
// ============================================

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companyLegalName?: string;
  country: string;
  currency: string;
}) {
  try {
    const data = signUpSchema.parse(input);

    const usersRepository = getUsersRepository();
    const authenticationService = getAuthenticationService();
    const transactionService = getTransactionManagerService();

    // Check if email is already taken
    const existingUser = await usersRepository.getUserByEmail(data.email);
    if (existingUser) {
      return { error: 'Email already registered' };
    }

    // Create user first
    const userId = authenticationService.generateUserId();
    const newUser = await usersRepository.createUser({
      id: userId,
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'STAFF', // Default role, will be OWNER via company member
    });

    // Generate slug from company name
    const slug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug is already taken
    const companiesRepository = getCompaniesRepository();
    const existingCompany = await companiesRepository.getCompanyBySlug(slug);
    if (existingCompany) {
      return { error: 'A company with this name already exists' };
    }

    // Create company and company member in a transaction
    const { company, companyMember } = await transactionService.startTransaction(
      async (tx) => {
        // Create company
        const companyId = generateIdFromEntropySize(10);
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

        const company = await companiesRepository.createCompany(
          {
            id: companyId,
            name: data.companyName,
            legalName: data.companyLegalName || null,
            slug: `${slug}-${companyId.slice(0, 6)}`, // Add unique suffix
            country: data.country,
            currency: data.currency,
            subscriptionPlan: 'BASIC',
            trialEndsAt,
          },
          tx
        );

        // Create company member (OWNER)
        const companyMembersRepository = getCompanyMembersRepository();
        const companyMemberId = generateIdFromEntropySize(10);
        const companyMember = await companyMembersRepository.createCompanyMember(
          {
            id: companyMemberId,
            userId: newUser.id,
            companyId: company.id,
            role: 'OWNER',
          },
          tx
        );

        return { company, companyMember };
      }
    );

    // Create session after transaction
    const { cookie } = await authenticationService.createSession(newUser);
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.attributes);

    // Redirect based on user type (new sign-ups are company owners, so go to company dashboard)
    redirect('/app/dashboard');
  } catch (err) {
    // Don't catch Next.js redirect errors - let them propagate
    if (isRedirectError(err)) {
      throw err;
    }

    console.error('Sign up error:', err);

    if (err instanceof z.ZodError) {
      return {
        error: err.issues[0]?.message || 'Invalid data. Make sure the Password and Confirm Password match.',
      };
    }

    if (err instanceof InputParseError) {
      return {
        error: 'Invalid data. Make sure the Password and Confirm Password match.',
      };
    }

    if (err instanceof AuthenticationError) {
      return { error: err.message };
    }

    return {
      error: 'An error happened. Please try again later.',
    };
  }
}

// ============================================
// SIGN IN
// ============================================

export async function signIn(input: { email: string; password: string }) {
  try {
    const data = signInSchema.parse(input);

    const usersRepository = getUsersRepository();
    const authenticationService = getAuthenticationService();

    const existingUser = await usersRepository.getUserByEmail(data.email);

    if (!existingUser) {
      return { error: 'Incorrect email or password' };
    }

    const validPassword = await authenticationService.validatePasswords(
      data.password,
      existingUser.password_hash
    );

    if (!validPassword) {
      return { error: 'Incorrect email or password' };
    }

    const { cookie } = await authenticationService.createSession(existingUser);
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.attributes);

    // Get dashboard path based on user type
    let dashboardPath = '/app/dashboard'; // default
    try {
      dashboardPath = await getDashboardRedirect(cookie.value);
    } catch (err: unknown) {
      // If we can't determine user type, log the error and default to company dashboard
      // The layout will handle redirecting staff members to the correct dashboard
      console.error('Error determining dashboard redirect:', err);
      dashboardPath = '/app/dashboard';
    }

    // redirect() throws a special error that Next.js handles
    redirect(dashboardPath);
  } catch (err) {
    // Don't catch Next.js redirect errors - let them propagate
    if (isRedirectError(err)) {
      throw err;
    }

    console.error('Sign in error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0]?.message || 'Invalid input' };
    }

    if (err instanceof InputParseError || err instanceof AuthenticationError) {
      return { error: 'Incorrect email or password' };
    }

    return { error: 'An error happened. Please try again later.' };
  }
}

// ============================================
// SIGN OUT
// ============================================

export async function signOut() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  try {
    if (!sessionId) {
      redirect('/sign-in');
    }

    // Validate session exists
    const authService = getAuthenticationService();
    const { session } = await authService.validateSession(sessionId);

    // Sign out
    const { blankCookie } = await authService.invalidateSession(session.id);
    cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

    redirect('/sign-in');
  } catch (err) {
    // Don't catch Next.js redirect errors - let them propagate
    if (isRedirectError(err)) {
      throw err;
    }

    if (err instanceof UnauthenticatedError || err instanceof InputParseError) {
      redirect('/sign-in');
    }

    console.error('Sign out error:', err);
    throw err;
  }
}