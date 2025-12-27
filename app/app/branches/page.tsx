import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany } from '../companies/actions';
import { getBranchesWithMetrics } from './actions';
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
    
    // Get tips from last 30 days - let the database do the aggregation work!
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const branchesWithMetrics = await getBranchesWithMetrics(company.id, thirtyDaysAgo);

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