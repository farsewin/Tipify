import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getBranches, getCompany, getStaff, getTips } from '../actions';
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
import { Plus, MapPin, Users, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import BranchesTable from './branches-table';

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

  function formatCurrency(amount: number, currency: string): string {
    const amountInUnits = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUnits);
  }

  // Calculate overall stats
  const totalStaff = branches.reduce((sum, b) => sum + b.staffCount, 0);
  const totalTips = branches.reduce((sum, b) => sum + b.totalTips, 0);
  const activeBranches = branches.filter(b => b.active).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage your company locations</p>
        </div>
        <Link href="/app/branches/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </Link>
      </div>

      {/* Overview Stats */}
      {branches.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeBranches} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStaff}</div>
              <p className="text-xs text-muted-foreground">
                Across all branches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tips (30d)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalTips, company.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Branch</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(branches.length > 0 ? totalTips / branches.length : 0, company.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per location
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {branches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No branches yet</CardTitle>
            <CardDescription>
              Get started by creating your first branch location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/branches/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Branch
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Branches</CardTitle>
            <CardDescription>
              {branches.length} branch{branches.length !== 1 ? 'es' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BranchesTable branches={branches} companyId={company.id} currency={company.currency} />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 