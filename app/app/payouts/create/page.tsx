import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany, getBranches, getTips } from '../../actions';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import CreatePayoutBatchClient from './create-payout-batch-client';

async function getCompanyData() {
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
    const company = await getCompany(companies[0].companyId);
    const branches = await getBranches(company.id, true);
    const pendingTips = await getTips(company.id, undefined, undefined, 'PENDING', 'SUCCEEDED');

    return { company, branches, pendingTips };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function CreatePayoutBatchPage() {
  const { company, branches, pendingTips } = await getCompanyData();

  return (
    <CreatePayoutBatchClient
      companyId={company.id}
      branches={branches}
      pendingTips={pendingTips}
      currency={company.currency}
    />
  );
}







