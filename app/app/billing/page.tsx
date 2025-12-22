import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getCompany } from '../companies/actions';
import { getBranches } from '../branches/actions';
import { getUserCompanies } from '@/src/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Badge } from '../../_components/ui/badge';
import { Building2, CreditCard, Calendar } from 'lucide-react';

async function getBillingData() {
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

    // Calculate monthly cost (mock - replace with real subscription logic)
    const planPrices: Record<string, number> = {
      BASIC: 149,
      PRO: 249,
      ENTERPRISE: 399,
    };
    const pricePerBranch = planPrices[company.subscriptionPlan] || 149;
    const totalMonthlyCost = branches.length * pricePerBranch;

    return { company, branches, totalMonthlyCost, pricePerBranch };
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    throw err;
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function BillingPage() {
  const { company, branches, totalMonthlyCost, pricePerBranch } = await getBillingData();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge variant="secondary" className="text-sm">
                {company.subscriptionPlan}
              </Badge>
            </div>
            <CardDescription>Your active subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={
                    company.subscriptionStatus === 'ACTIVE'
                      ? 'default'
                      : company.subscriptionStatus === 'TRIALING'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {company.subscriptionStatus}
                </Badge>
              </div>
              {company.trialEndsAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trial Ends</span>
                  <span className="text-sm font-medium">
                    {new Date(company.trialEndsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost</CardTitle>
            <CardDescription>Current billing calculation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {branches.length} branch{branches.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(pricePerBranch, company.currency)} each
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(totalMonthlyCost, company.currency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">per month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <p className="font-medium">Plan: {company.subscriptionPlan}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(pricePerBranch, company.currency)} per branch per month
                </p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>

            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Payment gateway integration is required for subscription
                management. Contact support to update your subscription or payment method.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







