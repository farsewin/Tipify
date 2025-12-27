import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany } from '../companies/actions';
import { getBranches } from './actions';
import { getStaff } from '../staff/actions';
import { getTips } from '../tips/actions';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import BranchesPageClient from './branches-page-client';

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
    const branches = await getBranches(company.id);
    
    // Get all staff and tips to calculate branch-specific metrics
    const allStaff = await getStaff(company.id);
    
    // Get tips from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allTips = await getTips(company.id, {
      paymentStatus: 'SUCCEEDED',
      startDate: thirtyDaysAgo,
    });

    // Calculate metrics for each branch
    const branchesWithMetrics = branches.map(branch => {
      const branchStaff = allStaff.filter(s => s.branchId === branch.id);
      const branchTips = allTips.filter(t => t.branchId === branch.id);
      const totalTips = branchTips.reduce((sum, tip) => sum + tip.amount, 0);
      const avgTip = branchTips.length > 0 ? totalTips / branchTips.length : 0;
      
      // Last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentTips = branchTips.filter(t => new Date(t.createdAt) >= sevenDaysAgo);
      const recentAmount = recentTips.reduce((sum, tip) => sum + tip.amount, 0);

      return {
        ...branch,
        staffCount: branchStaff.length,
        tipsCount: branchTips.length,
        totalTips,
        avgTip,
        recentTipsCount: recentTips.length,
        recentAmount,
      };
    });

    return { company, branches: branchesWithMetrics };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function BranchesPage() {
  const { company, branches } = await getCompanyData();

  return (
    <BranchesPageClient
      branches={branches}
      companyId={company.id}
    />
  );
} 