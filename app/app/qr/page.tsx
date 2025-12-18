import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany, getBranches, getStaff } from '../actions';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../_components/ui/tabs';
import QRCodeSection from './qr-code-section';

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
    const staff = await getStaff(company.id, undefined, true);

    return { company, branches, staff };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function QRCodePage() {
  const { company, branches, staff } = await getCompanyData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR Codes</h1>
        <p className="text-muted-foreground">
          Generate QR codes for branches and staff members
        </p>
      </div>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList>
          <TabsTrigger value="branches">Branch QR Codes</TabsTrigger>
          <TabsTrigger value="staff">Staff QR Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="space-y-4">
          {branches.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No branches yet</CardTitle>
                <CardDescription>
                  Create a branch first to generate QR codes.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <QRCodeSection
                  key={branch.id}
                  type="branch"
                  companyId={company.id}
                  id={branch.id}
                  name={branch.name}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          {staff.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No staff yet</CardTitle>
                <CardDescription>
                  Create staff profiles first to generate QR codes.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staff.map((member) => (
                <QRCodeSection
                  key={member.id}
                  type="staff"
                  companyId={company.id}
                  id={member.id}
                  name={member.displayName}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

