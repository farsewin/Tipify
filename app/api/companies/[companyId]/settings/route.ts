import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/config';
import { getCompaniesRepository } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  legalName: z.string().max(200).optional(),
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = updateCompanySchema.parse(body);

    await validateCompanyAccess(sessionId, companyId, 'ADMIN');

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(companyId);

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.legalName !== undefined) updates.legalName = data.legalName;
    if (data.country !== undefined) updates.country = data.country;
    if (data.currency !== undefined) updates.currency = data.currency;

    await companiesRepository.updateCompany(companyId, updates);

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

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'You do not have permission to update company settings' },
        { status: 403 }
      );
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    console.error('Update company settings error:', err);
    return NextResponse.json(
      { error: 'An error happened while updating company settings. Please try again later.' },
      { status: 500 }
    );
  }
}

