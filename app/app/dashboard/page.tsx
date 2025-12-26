import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany, getUserCompaniesList } from '../companies/actions';
import { getBranches } from '../branches/actions';
import { getStaff } from '../staff/actions';
import { getTips } from '../tips/actions';
import { getAuthenticationService } from '@/src/service-locator';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Separator } from '../../_components/ui/separator';
import { Building2, Users, DollarSign, TrendingUp, Calendar, Award, Activity } from 'lucide-react';
import DashboardCharts from './_components/dashboard-charts';

async function getCurrentUserCompany() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const companies = await getUserCompaniesList();

    if (companies.length === 0) {
      return null;
    }

    const firstCompany = companies[0];
    const company = await getCompany(firstCompany.companyId);
    const branches = await getBranches(company.id, true);
    const staff = await getStaff(company.id, undefined, true);
    
    // Get tips for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTips = await getTips(company.id, {
      paymentStatus: 'SUCCEEDED',
      startDate: thirtyDaysAgo,
    });

    const totalTipsAmount = recentTips.reduce((sum, tip) => sum + tip.amount, 0);
    const pendingTipsCount = recentTips.filter(
      (tip) => tip.distributionStatus === 'PENDING'
    ).length;

    return { company, user, branches, staff, recentTips, totalTipsAmount, pendingTipsCount };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

export default async function DashboardPage() {
  const result = await getCurrentUserCompany();

  if (!result) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>You don't have access to any companies yet.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { company, user, branches, staff, recentTips, totalTipsAmount, pendingTipsCount } = result;

  function formatCurrency(amount: number): string {
    const amountInUnits = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUnits);
  }

  // Calculate additional metrics
  const averageTipAmount = recentTips.length > 0 ? totalTipsAmount / recentTips.length : 0;
  
  // Today's tips
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysTips = recentTips.filter(tip => new Date(tip.createdAt) >= today);
  const todaysTipsAmount = todaysTips.reduce((sum, tip) => sum + tip.amount, 0);

  // This week's tips
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekTips = recentTips.filter(tip => new Date(tip.createdAt) >= weekAgo);
  const thisWeekAmount = thisWeekTips.reduce((sum, tip) => sum + tip.amount, 0);

  // Last 7 days for daily chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const dailyTipsData = last7Days.map(date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const dayTips = recentTips.filter(tip => {
      const tipDate = new Date(tip.createdAt);
      return tipDate >= date && tipDate < nextDay;
    });
    
    const amount = dayTips.reduce((sum, tip) => sum + tip.amount, 0);
    
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      tips: amount / 100,
      count: dayTips.length
    };
  });

  // Last 4 weeks for weekly chart
  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((3 - i) * 7));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });

  const weeklyTipsData = last4Weeks.map((weekStart, index) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekTips = recentTips.filter(tip => {
      const tipDate = new Date(tip.createdAt);
      return tipDate >= weekStart && tipDate < weekEnd;
    });
    
    const amount = weekTips.reduce((sum, tip) => sum + tip.amount, 0);
    
    return {
      name: `Week ${index + 1}`,
      tips: amount / 100,
      count: weekTips.length
    };
  });

  // Recent tips (last 5)
  const recentTipsList = [...recentTips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 lg:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {user.name}</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips (30d)</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTipsAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {recentTips.length} tip{recentTips.length !== 1 ? 's' : ''} received
            </p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tips</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(todaysTipsAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysTips.length} tip{todaysTips.length !== 1 ? 's' : ''} today
            </p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tips</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTipsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting distribution</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Tip</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageTipAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts
        dailyTipsData={dailyTipsData}
        weeklyTipsData={weeklyTipsData}
      />

      {/* Recent Activity and Organization Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tips</CardTitle>
            <CardDescription>Last 5 tips received</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTipsList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No tips received yet</p>
            ) : (
              <div className="space-y-4">
                {recentTipsList.map((tip, index) => (
                  <div key={tip.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {formatCurrency(tip.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tip.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tip.distributionStatus === 'PENDING' 
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                        }`}>
                          {tip.distributionStatus}
                        </span>
                      </div>
                    </div>
                    {index < recentTipsList.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Quick Stats */}
        <div className="space-y-4">
          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branches</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {branches.filter(b => b.active).length} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {staff.filter(s => s.active).length} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(thisWeekAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {thisWeekTips.length} tips in 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Company</CardTitle>
            <CardDescription>{company.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{company.subscriptionStatus.toLowerCase()}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Plan:</span> {company.subscriptionPlan}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/app/branches"
                className="block text-sm text-primary hover:underline"
              >
                Manage Branches
              </a>
              <a
                href="/app/staff"
                className="block text-sm text-primary hover:underline"
              >
                Manage Staff
              </a>
              <a
                href="/app/tips"
                className="block text-sm text-primary hover:underline"
              >
                View Tips
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {company.trialEndsAt && (
                <p className="text-sm">
                  <span className="font-medium">Trial ends:</span>{' '}
                  {new Date(company.trialEndsAt).toLocaleDateString()}
                </p>
              )}
              <a
                href="/app/billing"
                className="block text-sm text-primary hover:underline"
              >
                Manage Billing
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}