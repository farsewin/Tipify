import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getStaff, getCompany, getBranches } from '../actions';
import { getAuthenticationService } from '@/src/service-locator';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Button } from '../../_components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import StaffTable from './staff-table';

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-muted-foreground">Manage your staff profiles</p>
        </div>
        <Link href="/app/staff/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </Link>
      </div>

      {staff.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No staff yet</CardTitle>
            <CardDescription>
              Get started by creating your first staff profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/staff/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Staff Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Staff</CardTitle>
            <CardDescription>
              {staff.length} staff member{staff.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffTable staff={staff} branches={branches} companyId={company.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

