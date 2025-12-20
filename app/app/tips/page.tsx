import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getTips, getCompany, getBranches, getStaff } from '../actions';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import TipsTable from './tips-table';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';

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
    const branches = await getBranches(company.id, true);
    const staff = await getStaff(company.id, undefined, true);
    const tips = await getTips(company.id);

    return { company, branches, staff, tips };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

function formatCurrency(amount: number, currency: string): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default async function TipsPage() {
  const { company, branches, staff, tips } = await getCompanyData();

  // Create lookup maps
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const staffMap = new Map(staff.map((s) => [s.id, s.displayName]));

  // Calculate stats
  const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
  const pendingTips = tips.filter(tip => tip.distributionStatus === 'PENDING' && tip.paymentStatus === 'SUCCEEDED');
  const paidTips = tips.filter(tip => tip.distributionStatus === 'PAID');
  const pendingAmount = pendingTips.reduce((sum, tip) => sum + tip.amount, 0);
  const paidAmount = paidTips.reduce((sum, tip) => sum + tip.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tips</h1>
        <p className="text-muted-foreground">View and manage all tips</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount, company.currency)}</div>
            <p className="text-xs text-muted-foreground">{tips.length} transaction{tips.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount, company.currency)}</div>
            <p className="text-xs text-muted-foreground">{pendingTips.length} tip{pendingTips.length !== 1 ? 's' : ''} to distribute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount, company.currency)}</div>
            <p className="text-xs text-muted-foreground">{paidTips.length} tip{paidTips.length !== 1 ? 's' : ''} distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tips Table */}
      {tips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tips yet</CardTitle>
            <CardDescription>
              Tips will appear here once customers start tipping.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Tips</CardTitle>
            <CardDescription>
              {tips.length} tip{tips.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TipsTable
              tips={tips.map((tip) => ({
                ...tip,
                branchName: branchMap.get(tip.branchId) || 'Unknown',
                staffName: staffMap.get(tip.staffProfileId) || 'Unknown',
                formattedAmount: formatCurrency(tip.amount, tip.currency),
              }))}
              companyId={company.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
