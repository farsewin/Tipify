import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getPayoutBatches, getCompany, getBranches } from '../actions';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import Link from 'next/link';
import { Button } from '../../_components/ui/button';
import { Plus, CheckCircle2, Clock } from 'lucide-react';

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
    const payoutBatches = await getPayoutBatches(company.id);

    return { company, branches, payoutBatches };
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

export default async function PayoutsPage() {
  const { company, branches, payoutBatches } = await getCompanyData();

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payout Batches</h1>
          <p className="text-muted-foreground">
            Manage tip distributions to staff members
          </p>
        </div>
        <Link href="/app/payouts/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Payout Batch
          </Button>
        </Link>
      </div>

      {payoutBatches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No payout batches yet</CardTitle>
            <CardDescription>
              Create a payout batch from pending tips to track distributions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/payouts/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Payout Batch
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payoutBatches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Payout Batch - {new Date(batch.payoutDate).toLocaleDateString()}
                    </CardTitle>
                    <CardDescription>
                      {batch.branchId
                        ? `Branch: ${branchMap.get(batch.branchId) || 'Unknown'}`
                        : 'All Branches'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {batch.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(batch.totalAmount, batch.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(batch.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/app/payouts/${batch.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}







