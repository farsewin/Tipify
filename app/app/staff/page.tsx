import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getStaff, getCompany, getBranches } from '../actions';
import { getAuthenticationService } from '@/src/service-locator';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import StaffPageClient from './staff-page-client';

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
    const staff = await getStaff(company.id, undefined, false); // Get all staff including inactive for filtering

    return { company, branches, staff };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function StaffPage() {
  const { company, branches, staff } = await getCompanyData();

  return (
    <StaffPageClient
      staff={staff}
      branches={branches}
      companyId={company.id}
    />
  );
}

