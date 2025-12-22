import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompaniesRepository } from '@/src/service-locator';
import {
  validateCompanyAccess,
  getUserCompanies,
} from '@/src/shared/helpers/access-control';
import { NotFoundError } from '@/src/shared/errors/common';
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

export async function getCompany(companyId: string) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(companyId);

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get company error:', err);
    throw err;
  }
}

export async function getUserCompaniesList() {
  try {
    const sessionId = await getSessionId();
    return await getUserCompanies(sessionId);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    console.error('Get user companies error:', err);
    throw err;
  }
}

