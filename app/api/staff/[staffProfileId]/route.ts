import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/config';
import { getStaffProfilesRepository, getBranchesRepository } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

const updateStaffSchema = z.object({
  companyId: z.string(),
  displayName: z.string().min(1).max(100).optional(),
  position: z.string().max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
  branchId: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ staffProfileId: string }> }
) {
  try {
    const { staffProfileId } = await params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = updateStaffSchema.parse(body);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const staffProfilesRepository = getStaffProfilesRepository();
    const existingStaff = await staffProfilesRepository.getStaffProfile(staffProfileId);

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff profile not found' },
        { status: 404 }
      );
    }

    if (existingStaff.companyId !== data.companyId) {
      return NextResponse.json(
        { error: 'Staff profile does not belong to this company' },
        { status: 403 }
      );
    }

    if (data.branchId && data.branchId !== existingStaff.branchId) {
      const branchesRepository = getBranchesRepository();
      const branch = await branchesRepository.getBranch(data.branchId);
      if (!branch || branch.companyId !== data.companyId) {
        return NextResponse.json(
          { error: 'Branch does not belong to this company' },
          { status: 403 }
        );
      }
    }

    const updates: any = {};
    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.position !== undefined) updates.position = data.position;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
    if (data.active !== undefined) updates.active = data.active;
    if (data.branchId !== undefined) updates.branchId = data.branchId;

    await staffProfilesRepository.updateStaffProfile(staffProfileId, updates);

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
        { error: 'You do not have permission to update staff' },
        { status: 403 }
      );
    }

    console.error('Update staff error:', err);
    return NextResponse.json(
      { error: 'An error happened while updating the staff profile. Please try again later.' },
      { status: 500 }
    );
  }
}

