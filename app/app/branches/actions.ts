import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getBranchesRepository } from '@/src/service-locator';
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

export async function getBranches(companyId: string, activeOnly?: boolean) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const branchesRepository = getBranchesRepository();

    if (activeOnly) {
      return branchesRepository.getActiveBranchesByCompany(companyId);
    }

    return branchesRepository.getBranchesByCompany(companyId);
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get branches error:', err);
    throw err;
  }
}

