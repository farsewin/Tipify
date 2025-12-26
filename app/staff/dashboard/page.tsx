import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getMyStaffProfile, getMyStaffTips } from './actions';
import { getAuthenticationService } from '@/src/service-locator';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Star, DollarSign } from 'lucide-react';

async function getStaffData() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const staffProfile = await getMyStaffProfile();
    if (!staffProfile) {
      return { user, staffProfile: null, tips: [] };
    }

    // Get tips for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const tips = await getMyStaffTips(thirtyDaysAgo);

    // Calculate statistics
    const totalTipsAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
    const pendingTipsCount = tips.filter(
      (tip) => tip.distributionStatus === 'PENDING'
    ).length;
    const averageRating =
      tips.filter((t) => t.customerRating).length > 0
        ? tips
            .filter((t) => t.customerRating)
            .reduce((sum, t) => sum + (t.customerRating || 0), 0) /
          tips.filter((t) => t.customerRating).length
        : 0;

    return {
      user,
      staffProfile,
      tips,
      totalTipsAmount,
      pendingTipsCount,
      averageRating,
    };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

function formatCurrency(amount: number): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default async function StaffDashboardPage() {
  const data = await getStaffData();

  if (!data.staffProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff Dashboard</CardTitle>
            <CardDescription>
              You don&apos;t have a staff profile linked to your account yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your company administrator to link your account to a staff profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { staffProfile, tips, totalTipsAmount, pendingTipsCount, averageRating } = data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {staffProfile.displayName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTipsAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {tips.length} tip{tips.length !== 1 ? 's' : ''} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTipsCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting distribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {tips.filter((t) => t.customerRating).length} rating
              {tips.filter((t) => t.customerRating).length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tips</CardTitle>
          <CardDescription>Your tip history</CardDescription>
        </CardHeader>
        <CardContent>
          {tips.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tips received yet
            </p>
          ) : (
            <div className="space-y-4">
              {tips.map((tip) => (
                <div key={tip.id} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {formatCurrency(tip.amount)}
                      </p>
                      {tip.distributionStatus === 'PENDING' && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Pending
                        </span>
                      )}
                      {tip.distributionStatus === 'PAID' && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Paid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tip.createdAt).toLocaleDateString()}
                    </p>
                    {tip.customerNote && (
                      <p className="text-sm mt-1">{tip.customerNote}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {tip.customerRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{tip.customerRating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}







