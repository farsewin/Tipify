import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/config';
import { getBranchesRepository } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

const updateBranchSchema = z.object({
  companyId: z.string(),
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(255).nullable().optional(),
  timezone: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const { branchId } = await params;
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

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await validateCompanyAccess(sessionId, companyId);

    const branchesRepository = getBranchesRepository();
    const branch = await branchesRepository.getBranch(branchId);

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    if (branch.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ branch });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get branch error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching the branch.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const { branchId } = await params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = updateBranchSchema.parse(body);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const branchesRepository = getBranchesRepository();
    const existingBranch = await branchesRepository.getBranch(branchId);

    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    if (existingBranch.companyId !== data.companyId) {
      return NextResponse.json(
        { error: 'Branch does not belong to this company' },
        { status: 403 }
      );
    }

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.location !== undefined) updates.location = data.location;
    if (data.timezone !== undefined) updates.timezone = data.timezone;
    if (data.active !== undefined) updates.active = data.active;

    await branchesRepository.updateBranch(branchId, updates);

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
        { error: 'You do not have permission to update branches' },
        { status: 403 }
      );
    }

    console.error('Update branch error:', err);
    return NextResponse.json(
      { error: 'An error happened while updating the branch. Please try again later.' },
      { status: 500 }
    );
  }
}

