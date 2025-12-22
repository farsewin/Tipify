import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getTipsRepository } from '@/src/service-locator';
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

export async function getTips(
  companyId: string,
  filters?: {
    branchId?: string;
    staffProfileId?: string;
    distributionStatus?: 'PENDING' | 'PAID';
    paymentStatus?: 'SUCCEEDED' | 'PENDING' | 'FAILED';
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const tipsRepository = getTipsRepository();
    return tipsRepository.getTipsByCompany(companyId, filters || {});
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get tips error:', err);
    throw err;
  }
}


