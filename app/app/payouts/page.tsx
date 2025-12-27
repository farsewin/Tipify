import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany } from '../companies/actions';
import { getBranches } from '../branches/actions';
import { getStaff } from '../staff/actions';
import { getPayoutBatches } from './actions';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import PayoutsPageClient from './payouts-page-client';

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

    const company = await getCompany(companies[0].companyId);
    const [branches, staff, payoutBatches] = await Promise.all([
      getBranches(company.id, true),
      getStaff(company.id, undefined, true),
      getPayoutBatches(company.id),
    ]);

    return { company, branches, staff, payoutBatches };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

function formatCurrency(amount: number): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default async function PayoutsPage() {
  const { company, branches, staff, payoutBatches } = await getCompanyData();

  // Calculate stats
  const totalAmount = payoutBatches.reduce((sum, batch) => sum + batch.totalAmount, 0);
  const pendingBatches = payoutBatches.filter(b => b.status === 'PENDING');
  const completedBatches = payoutBatches.filter(b => b.status === 'COMPLETED');
  const pendingAmount = pendingBatches.reduce((sum, batch) => sum + batch.totalAmount, 0);
  const completedAmount = completedBatches.reduce((sum, batch) => sum + batch.totalAmount, 0);

  return (
    <PayoutsPageClient
      companyId={company.id}
      branches={branches}
      staff={staff}
      payoutBatches={payoutBatches}
      stats={{
        totalAmount: formatCurrency(totalAmount),
        pendingAmount: formatCurrency(pendingAmount),
        completedAmount: formatCurrency(completedAmount),
        totalCount: payoutBatches.length,
        pendingCount: pendingBatches.length,
        completedCount: completedBatches.length,
      }}
    />
  );
}