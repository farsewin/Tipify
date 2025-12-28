import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/src/lib/auth';
import {
  getUsersRepository,
  getCompaniesRepository,
  getCompanyMembersRepository,
  getTransactionManagerService,
} from '@/src/service-locator';
import { InputParseError } from '@/src/shared/errors/common';
import { AuthenticationError } from '@/src/shared/errors/auth';

const signUpSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(8).max(255),
    confirmPassword: z.string().min(8).max(255),
    companyName: z.string().min(1).max(100),
    companyLegalName: z.string().max(200).optional(),
    country: z.string().length(2),
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

export async function POST(request: NextRequest) {
  console.log('🔐 [SignUp API] Sign-up request received');

  try {
    const body = await request.json();
    console.log('🔐 [SignUp API] Request body parsed');
    console.log(
      '🔐 [SignUp API] Email:',
      body.email,
      'Company:',
      body.companyName
    );

    const data = signUpSchema.parse(body);
    console.log('🔐 [SignUp API] Validation passed');

    const usersRepository = getUsersRepository();
    const transactionService = getTransactionManagerService();

    // Check if user already exists
    const existingUser = await usersRepository.getUserByEmail(data.email);
    if (existingUser) {
      console.log('❌ [SignUp API] Email already registered:', data.email);
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if company slug already exists
    const slug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const companiesRepository = getCompaniesRepository();
    const existingCompany = await companiesRepository.getCompanyBySlug(slug);
    if (existingCompany) {
      console.log('❌ [SignUp API] Company slug already exists:', slug);
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 400 }
      );
    }

    // Use Better Auth to create the user account
    console.log('🔐 [SignUp API] Creating user with Better Auth...');

    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    if (!signUpResult || !signUpResult.user) {
      console.log('❌ [SignUp API] Better Auth sign-up failed');
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    console.log(
      '✅ [SignUp API] User created with Better Auth:',
      signUpResult.user.id
    );

    // Now create the company and company member in a transaction
    console.log('🔐 [SignUp API] Creating company and membership...');

    const { company } = await transactionService.startTransaction(
      async (tx) => {
        const companyId = crypto.randomUUID();
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const company = await companiesRepository.createCompany(
          {
            id: companyId,
            name: data.companyName,
            legalName: data.companyLegalName || null,
            slug: `${slug}-${companyId.slice(0, 6)}`,
            country: data.country,
            subscriptionPlan: 'BASIC',
            trialEndsAt,
          },
          tx
        );

        console.log('✅ [SignUp API] Company created:', company.id);

        const companyMembersRepository = getCompanyMembersRepository();
        const companyMemberId = crypto.randomUUID();
        await companyMembersRepository.createCompanyMember(
          {
            id: companyMemberId,
            userId: signUpResult.user.id,
            companyId: company.id,
            role: 'OWNER',
          },
          tx
        );

        console.log('✅ [SignUp API] Company member created:', companyMemberId);

        return { company };
      }
    );

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      redirect: '/app/dashboard',
    });

    // Set the session cookie
    if (signUpResult.token) {
      console.log('🔐 [SignUp API] Setting session cookie...');
      response.cookies.set('better-auth.session_token', signUpResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    console.log('✅ [SignUp API] Sign-up successful');
    return response;
  } catch (err) {
    console.error('❌ [SignUp API] Error:', err);

    if (err instanceof z.ZodError) {
      console.log('❌ [SignUp API] Validation error:', err.issues);
      return NextResponse.json(
        {
          error:
            err.issues[0]?.message ||
            'Invalid data. Make sure the Password and Confirm Password match.',
        },
        { status: 400 }
      );
    }

    if (err instanceof InputParseError) {
      return NextResponse.json(
        {
          error:
            'Invalid data. Make sure the Password and Confirm Password match.',
        },
        { status: 400 }
      );
    }

    if (err instanceof AuthenticationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An error happened. Please try again later.' },
      { status: 500 }
    );
  }
}
