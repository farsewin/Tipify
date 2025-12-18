import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany, getBranches } from '../../actions';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import CreateStaffClient from './create-staff-client';

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

    return { company, branches };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function CreateStaffPage() {
  const { company, branches } = await getCompanyData();

  return <CreateStaffClient companyId={company.id} branches={branches} />;
}

