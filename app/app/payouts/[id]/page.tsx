import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getPayoutBatchDetails, getCompany, getStaff } from '../../actions';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { Button } from '../../../_components/ui/button';
import { CheckCircle2, Clock } from 'lucide-react';
import CompletePayoutBatchButton from './complete-payout-batch-button';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getPayoutBatchData(companyId: string, payoutBatchId: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  try {
    const company = await getCompany(companyId);
    const payoutBatch = await getPayoutBatchDetails(companyId, payoutBatchId);
    const staff = await getStaff(companyId);

    return { company, payoutBatch, staff };
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
    currency,
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default async function PayoutBatchDetailsPage({ params }: PageProps) {
  // ✅ REQUIRED FIX: await params
  const { id } = await params;

  if (!id) {
    redirect('/sign-in');
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect('/sign-in');
  }

  const companies = await getUserCompanies(sessionId);
  if (companies.length === 0) {
    redirect('/sign-in');
  }

  const { company, payoutBatch, staff } = await getPayoutBatchData(
    companies[0].companyId,
    id
  );

  const staffMap = new Map(staff.map((s) => [s.id, s]));

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payout Batch Details</h1>
        <p className="text-muted-foreground">
          Payout Date:{' '}
          {new Date(
            payoutBatch.payoutBatch.payoutDate
          ).toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Batch Summary</CardTitle>
              <CardDescription>
                {payoutBatch.payoutItems.length} staff member
                {payoutBatch.payoutItems.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div>
              {payoutBatch.payoutBatch.status === 'COMPLETED' ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                  <Clock className="mr-2 h-4 w-4" />
                  Pending
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-2xl font-bold">
                {formatCurrency(
                  payoutBatch.payoutBatch.totalAmount,
                  payoutBatch.payoutBatch.currency
                )}
              </span>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Payout Items</h3>
              <div className="space-y-2">
                {payoutBatch.payoutItems.map((item) => {
                  const staffMember = staffMap.get(item.staffProfileId);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {staffMember?.displayName ??
                            `Staff ${item.staffProfileId.slice(0, 8)}`}
                        </p>
                        {staffMember?.position && (
                          <p className="text-sm text-muted-foreground">
                            {staffMember.position}
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {payoutBatch.payoutBatch.status === 'PENDING' && (
              <div className="pt-4 border-t">
                <CompletePayoutBatchButton
                  companyId={company.id}
                  payoutBatchId={payoutBatch.payoutBatch.id}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
