'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Star, Loader, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../_components/ui/dialog';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    tipId: string;
    transactionId?: string;
    amount: number;
    currency: string;
    rating?: number;
    note?: string;
  } | null>(null);

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

  const formatCurrency = (amountInCents: number): string => {
    const amountInUnits = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2,
    }).format(amountInUnits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!finalAmount || amountInCents < 500) {
      toast.error('Please enter a valid amount (minimum 5.00)');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tips/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          branchId: staff.branchId,
          staffProfileId: staff.id,
          amount: amountInCents,
          customerNote: note || undefined,
          customerRating: rating || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to process payment');
      } else if (result.success && result.tipId) {
        // Show success dialog
        setPaymentResult({
          tipId: result.tipId,
          transactionId: result.transactionId,
          amount: amountInCents,
          rating: rating || undefined,
          note: note || undefined,
        });
        setShowSuccessDialog(true);
        // Reset form
        setAmount('');
        setCustomAmount('');
        setRating(null);
        setNote('');
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
              <Label>Tip Amount (QAR)</Label>
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
                  Minimum: 5 QAR
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
                  {finalAmount ? `${finalAmount} QAR` : '0.00 QAR'}
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

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Payment Successful!</DialogTitle>
            <DialogDescription>Thank you for your tip</DialogDescription>
          </DialogHeader>
          {paymentResult && (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">You tipped</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(paymentResult.amount)}
                </p>
                <p className="text-lg">
                  to <span className="font-semibold">{staff.displayName}</span>
                </p>
              </div>

              {paymentResult.transactionId && (
                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="text-sm font-mono break-all">{paymentResult.transactionId}</p>
                </div>
              )}

              {paymentResult.rating && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
                  <div className="flex gap-1 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= paymentResult.rating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {paymentResult.note && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Your Note</p>
                  <p className="text-sm">{paymentResult.note}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                // Reset form for another tip
                setAmount('');
                setCustomAmount('');
                setRating(null);
                setNote('');
              }}
              className="w-full sm:w-auto"
            >
              Tip Again
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                // Optionally redirect to success page for full details
                if (paymentResult) {
                  router.push(
                    `/t/payment/success?tipId=${paymentResult.tipId}&transactionId=${paymentResult.transactionId || ''}`
                  );
                }
              }}
              className="w-full sm:w-auto"
            >
              View Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

