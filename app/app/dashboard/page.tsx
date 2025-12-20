import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany, getUserCompaniesList, getBranches, getStaff, getTips } from '../actions';
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
    const recentTips = await getTips(
      company.id,
      undefined,
      undefined,
      undefined,
      'SUCCEEDED',
      thirtyDaysAgo
    );

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

  function formatCurrency(amount: number, currency: string): string {
    const amountInUnits = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
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

  // Last 7 days for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const dailyTips = last7Days.map(date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const dayTips = recentTips.filter(tip => {
      const tipDate = new Date(tip.createdAt);
      return tipDate >= date && tipDate < nextDay;
    });
    
    const amount = dayTips.reduce((sum, tip) => sum + tip.amount, 0);
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: amount / 100,
      count: dayTips.length
    };
  });

  // Get max amount for chart scaling
  const maxAmount = Math.max(...dailyTips.map(d => d.amount), 1);

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTipsAmount, company.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentTips.length} tip{recentTips.length !== 1 ? 's' : ''} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tips</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(todaysTipsAmount, company.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysTips.length} tip{todaysTips.length !== 1 ? 's' : ''} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tips</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTipsCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting distribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Tip</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageTipAmount, company.currency)}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tips Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tips This Week</CardTitle>
            <CardDescription>Daily tip amounts for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyTips.map((day, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{day.date}</span>
                    <span className="font-medium">
                      {formatCurrency(day.amount * 100, company.currency)} ({day.count})
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(day.amount / maxAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
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
                          {formatCurrency(tip.amount, company.currency)}
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
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
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
      </div>

      {/* Organization Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">
              {branches.length === 1 ? 'Branch' : 'Branches'} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">Active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(thisWeekAmount, company.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {thisWeekTips.length} tips in 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTipsAmount / 30, company.currency)}
            </div>
            <p className="text-xs text-muted-foreground">Over 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
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
              <p className="text-sm">
                <span className="font-medium">Currency:</span> {company.currency}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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