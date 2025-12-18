import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany } from '../../actions';
import { getAuthenticationService } from '@/src/service-locator';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import CreateBranchClient from './create-branch-client';

async function getCompanyId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    const companies = await getUserCompanies(sessionId);
    if (companies.length === 0) {
      redirect('/sign-in');
    }

    // Use first company for now
    return companies[0].companyId;
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function CreateBranchPage() {
  const companyId = await getCompanyId();

  return <CreateBranchClient companyId={companyId} />;
}

