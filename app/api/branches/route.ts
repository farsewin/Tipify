import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateIdFromEntropySize } from 'lucia';
import { SESSION_COOKIE } from '@/config';
import { getBranchesRepository, getCompaniesRepository } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

const createBranchSchema = z.object({
  companyId: z.string(),
  name: z.string().min(1).max(100),
  location: z.string().max(255).optional(),
  timezone: z.string().default('UTC'),
});

export async function POST(request: NextRequest) {
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
    const data = createBranchSchema.parse(body);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(data.companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const branchesRepository = getBranchesRepository();
    const existingBranch = await branchesRepository.getBranchBySlugAndCompany(
      slug,
      data.companyId
    );

    if (existingBranch) {
      return NextResponse.json(
        { error: 'A branch with this name already exists' },
        { status: 400 }
      );
    }

    const branchId = generateIdFromEntropySize(10);
    await branchesRepository.createBranch({
      id: branchId,
      companyId: data.companyId,
      name: data.name,
      location: data.location || null,
      slug: `${slug}-${branchId.slice(0, 6)}`,
      timezone: data.timezone,
      active: true,
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

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'You do not have permission to create branches' },
        { status: 403 }
      );
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    console.error('Create branch error:', err);
    return NextResponse.json(
      { error: 'An error happened while creating the branch. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await validateCompanyAccess(sessionId, companyId);

    const branchesRepository = getBranchesRepository();

    if (activeOnly) {
      const branches = await branchesRepository.getActiveBranchesByCompany(companyId);
      return NextResponse.json({ branches });
    }

    const branches = await branchesRepository.getBranchesByCompany(companyId);
    return NextResponse.json({ branches });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get branches error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching branches.' },
      { status: 500 }
    );
  }
}

