import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getStaffProfilesRepository } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import {
  UnauthenticatedError,
  UnauthorizedError,
} from '@/src/shared/errors/auth';

async function getSessionId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new UnauthenticatedError('Must be logged in');
  }

  return sessionId;
}

export async function getStaff(companyId: string, branchId?: string, activeOnly?: boolean) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const staffProfilesRepository = getStaffProfilesRepository();

    if (branchId) {
      if (activeOnly) {
        return staffProfilesRepository.getActiveStaffProfilesByBranch(branchId);
      }
      return staffProfilesRepository.getStaffProfilesByBranch(branchId);
    }

    return staffProfilesRepository.getStaffProfilesByCompany(companyId);
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get staff error:', err);
    throw err;
  }
}

