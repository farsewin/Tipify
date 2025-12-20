'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Star, Loader } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { processTipPayment } from '../../../app/actions';
import { toast } from 'sonner';
import type { Company } from '@/src/models/company.model';
import type { StaffProfile } from '@/src/models/staff-profile.model';

interface StaffTippingPageProps {
  company: Company;
  staff: StaffProfile;
}

const QUICK_AMOUNTS = [10, 20, 50, 100]; // In currency units, will be converted to cents

export default function StaffTippingPage({ company, staff }: StaffTippingPageProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setAmount('');
  };

  const finalAmount = amount || customAmount;
  const amountInCents = finalAmount ? Math.round(parseFloat(finalAmount) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!finalAmount || amountInCents < 500) {
      toast.error('Please enter a valid amount (minimum 5.00)');
      return;
    }

    setLoading(true);

    try {
      const result = await processTipPayment({
        companyId: company.id,
        branchId: staff.branchId,
        staffProfileId: staff.id,
        amount: amountInCents,
        currency: company.currency,
        customerNote: note || undefined,
        customerRating: rating || undefined,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success && result.tipId) {
        // Redirect to success page
        router.push(`/t/payment/success?tipId=${result.tipId}&transactionId=${result.transactionId}`);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{company.name}</CardTitle>
          <CardDescription>Tip {staff.displayName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            {staff.avatarUrl ? (
              <Image
                src={staff.avatarUrl}
                alt={staff.displayName}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold">{staff.displayName}</h2>
              {staff.position && (
                <p className="text-muted-foreground">{staff.position}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Tip Amount ({company.currency})</Label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant={amount === quickAmount.toString() ? 'default' : 'outline'}
                    onClick={() => handleQuickAmount(quickAmount)}
                  >
                    {quickAmount}
                  </Button>
                ))}
              </div>
              <div className="pt-2">
                <Input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmount(e.target.value)}
                  min="5"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: 5 {company.currency}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rating (Optional)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        rating && star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note to Staff (Optional)</Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Leave a message..."
                maxLength={500}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold">
                  {finalAmount ? `${finalAmount} ${company.currency}` : '0.00 ' + company.currency}
                </span>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!finalAmount || amountInCents < 500 || loading} // Minimum 5.00 in cents
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

