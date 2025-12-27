import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany } from '../companies/actions';
import { getBranches } from '../branches/actions';
import { getStaff } from '../staff/actions';
import { getTipsWithRelations } from './actions';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import TipsPageClient from './tips-page-client';

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
    // Get tips with relations in a single optimized query (no N+1!)
    const tips = await getTipsWithRelations(company.id);
    
    // Still need branches and staff for filters, but these are smaller datasets
    const branches = await getBranches(company.id, true);
    const staff = await getStaff(company.id, undefined, true);

    return { company, branches, staff, tips };
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

export default async function TipsPage() {
  const { company, branches, staff, tips } = await getCompanyData();

  // Calculate stats - tips already have branchName and staffName from the query
  const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
  const pendingTips = tips.filter(tip => tip.distributionStatus === 'PENDING' && tip.paymentStatus === 'SUCCEEDED');
  const paidTips = tips.filter(tip => tip.distributionStatus === 'PAID');
  const pendingAmount = pendingTips.reduce((sum, tip) => sum + tip.amount, 0);
  const paidAmount = paidTips.reduce((sum, tip) => sum + tip.amount, 0);

  return (
    <TipsPageClient
      companyId={company.id}
      tips={tips.map((tip) => ({
        ...tip,
        formattedAmount: formatCurrency(tip.amount),
      }))}
      branches={branches}
      staff={staff}
      stats={{
        totalAmount: formatCurrency(totalAmount),
        pendingAmount: formatCurrency(pendingAmount),
        paidAmount: formatCurrency(paidAmount),
        totalCount: tips.length,
        pendingCount: pendingTips.length,
        paidCount: paidTips.length,
      }}
    />
  );
}