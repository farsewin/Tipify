import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateIdFromEntropySize } from 'lucia';
import {
  getUsersRepository,
  getCompaniesRepository,
  getCompanyMembersRepository,
  getAuthenticationService,
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
    currency: z.string().length(3),
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
  try {
    const body = await request.json();
    const data = signUpSchema.parse(body);

    const usersRepository = getUsersRepository();
    const authenticationService = getAuthenticationService();
    const transactionService = getTransactionManagerService();

    const existingUser = await usersRepository.getUserByEmail(data.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const userId = authenticationService.generateUserId();
    const newUser = await usersRepository.createUser({
      id: userId,
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'STAFF',
    });

    const slug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const companiesRepository = getCompaniesRepository();
    const existingCompany = await companiesRepository.getCompanyBySlug(slug);
    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 400 }
      );
    }

    const { company } = await transactionService.startTransaction(async (tx) => {
      const companyId = generateIdFromEntropySize(10);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const company = await companiesRepository.createCompany(
        {
          id: companyId,
          name: data.companyName,
          legalName: data.companyLegalName || null,
          slug: `${slug}-${companyId.slice(0, 6)}`,
          country: data.country,
          currency: data.currency,
          subscriptionPlan: 'BASIC',
          trialEndsAt,
        },
        tx
      );

      const companyMembersRepository = getCompanyMembersRepository();
      const companyMemberId = generateIdFromEntropySize(10);
      await companyMembersRepository.createCompanyMember(
        {
          id: companyMemberId,
          userId: newUser.id,
          companyId: company.id,
          role: 'OWNER',
        },
        tx
      );

      return { company };
    });

    const { cookie } = await authenticationService.createSession(newUser);
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.attributes);

    return NextResponse.json({ success: true, redirect: '/app/dashboard' });
  } catch (err) {
    console.error('Sign up error:', err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: err.issues[0]?.message || 'Invalid data. Make sure the Password and Confirm Password match.',
        },
        { status: 400 }
      );
    }

    if (err instanceof InputParseError) {
      return NextResponse.json(
        {
          error: 'Invalid data. Make sure the Password and Confirm Password match.',
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

