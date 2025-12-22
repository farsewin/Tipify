import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateIdFromEntropySize } from 'lucia';
import { SESSION_COOKIE } from '@/config';
import {
  getUsersRepository,
  getCompanyMembersRepository,
  getStaffProfilesRepository,
  getBranchesRepository,
  getCompaniesRepository,
  getAuthenticationService,
  getTransactionManagerService,
} from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError, AuthenticationError } from '@/src/shared/errors/auth';

const createStaffSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  position: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
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
    const data = createStaffSchema.parse(body);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const usersRepository = getUsersRepository();
    const companyMembersRepository = getCompanyMembersRepository();
    const transactionService = getTransactionManagerService();

    const existingUser = await usersRepository.getUserByEmail(data.email);
    if (existingUser) {
      const existingCompanyMembers = await companyMembersRepository.getCompanyMembersByUser(
        existingUser.id
      );
      if (existingCompanyMembers.length > 0) {
        return NextResponse.json(
          { error: 'User is already a company member and cannot have a staff profile' },
          { status: 400 }
        );
      }

      const staffProfilesRepository = getStaffProfilesRepository();
      const existingStaffProfiles = await staffProfilesRepository.getStaffProfilesByUser(
        existingUser.id
      );
      if (existingStaffProfiles.length > 0) {
        return NextResponse.json(
          { error: 'User already has a staff profile' },
          { status: 400 }
        );
      }

      const userId = existingUser.id;
      await transactionService.startTransaction(async (tx) => {
        const companiesRepository = getCompaniesRepository();
        const company = await companiesRepository.getCompany(data.companyId, tx);
        if (!company) {
          throw new NotFoundError('Company not found');
        }

        const branchesRepository = getBranchesRepository();
        const branch = await branchesRepository.getBranch(data.branchId, tx);
        if (!branch) {
          throw new NotFoundError('Branch not found');
        }
        if (branch.companyId !== data.companyId) {
          throw new NotFoundError('Branch does not belong to this company');
        }

        const publicId = generateIdFromEntropySize(16);
        let existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(publicId, tx);
        let attempts = 0;
        while (existingStaff && attempts < 5) {
          const newPublicId = generateIdFromEntropySize(16);
          existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(newPublicId, tx);
          attempts++;
        }

        const staffId = generateIdFromEntropySize(10);
        await staffProfilesRepository.createStaffProfile(
          {
            id: staffId,
            companyId: data.companyId,
            branchId: data.branchId,
            userId: userId,
            displayName: data.displayName,
            position: data.position || null,
            avatarUrl: data.avatarUrl || null,
            publicId: existingStaff ? generateIdFromEntropySize(16) : publicId,
            active: true,
          },
          tx
        );
      });

      return NextResponse.json({ success: true });
    }

    const authenticationService = getAuthenticationService();
    const userId = authenticationService.generateUserId();

    await transactionService.startTransaction(async (tx) => {
      await usersRepository.createUser(
        {
          id: userId,
          name: data.displayName,
          email: data.email,
          password: data.password,
          role: 'STAFF',
        },
        tx
      );

      const companiesRepository = getCompaniesRepository();
      const company = await companiesRepository.getCompany(data.companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found');
      }

      const branchesRepository = getBranchesRepository();
      const branch = await branchesRepository.getBranch(data.branchId, tx);
      if (!branch) {
        throw new NotFoundError('Branch not found');
      }
      if (branch.companyId !== data.companyId) {
        throw new NotFoundError('Branch does not belong to this company');
      }

      const publicId = generateIdFromEntropySize(16);
      const staffProfilesRepository = getStaffProfilesRepository();
      let existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(publicId, tx);
      let attempts = 0;
      while (existingStaff && attempts < 5) {
        const newPublicId = generateIdFromEntropySize(16);
        existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(newPublicId, tx);
        attempts++;
      }

      const staffId = generateIdFromEntropySize(10);
      await staffProfilesRepository.createStaffProfile(
        {
          id: staffId,
          companyId: data.companyId,
          branchId: data.branchId,
          userId: userId,
          displayName: data.displayName,
          position: data.position || null,
          avatarUrl: data.avatarUrl || null,
          publicId: existingStaff ? generateIdFromEntropySize(16) : publicId,
          active: true,
        },
        tx
      );
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

    if (err instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: 'You must be logged in to create staff' },
        { status: 401 }
      );
    }

    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: err.message || 'You do not have permission to create staff' },
        { status: 403 }
      );
    }

    if (err instanceof AuthenticationError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    console.error('Create staff error:', err);
    return NextResponse.json(
      { error: 'An error happened while creating the staff profile. Please try again later.' },
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
    const branchId = searchParams.get('branchId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await validateCompanyAccess(sessionId, companyId);

    const staffProfilesRepository = getStaffProfilesRepository();

    let staff;
    if (branchId) {
      if (activeOnly) {
        staff = await staffProfilesRepository.getActiveStaffProfilesByBranch(branchId);
      } else {
        staff = await staffProfilesRepository.getStaffProfilesByBranch(branchId);
      }
    } else {
      staff = await staffProfilesRepository.getStaffProfilesByCompany(companyId);
    }

    return NextResponse.json({ staff });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get staff error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching staff.' },
      { status: 500 }
    );
  }
}


