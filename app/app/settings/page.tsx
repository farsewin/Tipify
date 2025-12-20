import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany } from '../../../src/actions/actions';
import { getAuthenticationService } from '@/src/service-locator';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import SettingsPageClient from './settings-page-client';

async function getSettingsData() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const companies = await getUserCompanies(sessionId);
    if (companies.length === 0) {
      redirect('/sign-in');
    }

    // Use first company for now
    const company = await getCompany(companies[0].companyId);

    return { company, user };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function SettingsPage() {
  const { company, user } = await getSettingsData();

  return <SettingsPageClient company={company} user={user} />;
}







