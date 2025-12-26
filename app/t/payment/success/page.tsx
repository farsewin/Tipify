import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { getTipsRepository } from '@/src/service-locator';
import { getStaffProfilesRepository } from '@/src/service-locator';
import { CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { Button } from '../../../_components/ui/button';
import Link from 'next/link';

async function getTipData(tipId: string) {
  const tipsRepository = getTipsRepository();
  const tip = await tipsRepository.getTip(tipId);

  if (!tip) {
    return null;
  }

  const staffProfilesRepository = getStaffProfilesRepository();
  const staff = await staffProfilesRepository.getStaffProfile(tip.staffProfileId);

  return { tip, staff };
}

function formatCurrency(amount: number): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { tipId?: string; transactionId?: string };
}) {
  if (!searchParams.tipId) {
    redirect('/');
  }

  const tipData = await getTipData(searchParams.tipId);

  if (!tipData) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Tip Not Found</CardTitle>
            <CardDescription>The tip you're looking for doesn't exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { tip, staff } = tipData;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>Thank you for your tip</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">You tipped</p>
            <p className="text-3xl font-bold">
              {formatCurrency(tip.amount)}
            </p>
            {staff && (
              <p className="text-lg">
                to <span className="font-semibold">{staff.displayName}</span>
              </p>
            )}
          </div>

          {searchParams.transactionId && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Transaction ID</p>
              <p className="text-sm font-mono">{searchParams.transactionId}</p>
            </div>
          )}

          {tip.customerRating && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${
                      star <= tip.customerRating!
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}

          {tip.customerNote && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Your Note</p>
              <p className="text-sm">{tip.customerNote}</p>
            </div>
          )}

          <div className="border-t pt-4 flex gap-2">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Tip Another Staff Member
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

