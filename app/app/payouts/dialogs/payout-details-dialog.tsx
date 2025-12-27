'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../_components/ui/dialog';
import { Button } from '../../../_components/ui/button';
import { Separator } from '../../../_components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { toast } from 'sonner';

interface Staff {
  id: string;
  displayName: string;
  position?: string;
}

interface PayoutDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  companyId: string;
  staff: Staff[];
  startTransition: (callback: () => void) => void;
}

interface PayoutItem {
  id: string;
  staffProfileId: string;
  amount: number;
}

interface PayoutBatchDetails {
  payoutBatch: {
    id: string;
    payoutDate: Date;
    totalAmount: number;
    status: 'PENDING' | 'COMPLETED';
    createdAt: Date;
  };
  payoutItems: PayoutItem[];
}

function formatCurrency(amount: number): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default function PayoutDetailsDialog({
  open,
  onOpenChange,
  batchId,
  companyId,
  staff,
  startTransition,
}: PayoutDetailsDialogProps) {
  const router = useRouter();
  const [payoutBatchDetails, setPayoutBatchDetails] = useState<PayoutBatchDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Create staff lookup map
  const staffMap = useMemo(() => 
    new Map(staff.map((s) => [s.id, s])),
    [staff]
  );

  // Load payout batch details when dialog opens
  useEffect(() => {
    if (open && batchId) {
      loadPayoutBatchDetails();
    } else if (!open) {
      setPayoutBatchDetails(null);
    }
  }, [open, batchId]);

  const loadPayoutBatchDetails = async () => {
    if (!batchId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/payouts/${batchId}?companyId=${companyId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch payout batch details');
      }
      
      const details = await res.json();
      setPayoutBatchDetails(details);
    } catch (error) {
      toast.error('Failed to load payout batch details');
      console.error('Load payout batch details error:', error);
      setPayoutBatchDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayoutBatch = async () => {
    if (!batchId) return;
    
    if (!confirm('Mark this payout batch as completed? This action cannot be undone.')) {
      return;
    }

    setCompleting(true);
    try {
      const res = await fetch(`/api/payouts/${batchId}?companyId=${companyId}`, {
        method: 'PATCH',
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to complete payout batch');
      } else if (result.success) {
        toast.success('Payout batch marked as completed!');
        onOpenChange(false);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Complete payout batch error:', error);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payout Batch Details</DialogTitle>
          <DialogDescription>
            {payoutBatchDetails?.payoutBatch && (
              <>
                Batch #{payoutBatchDetails.payoutBatch.id.slice(0, 8)} •{' '}
                Payout Date:{' '}
                {new Date(
                  payoutBatchDetails.payoutBatch.payoutDate
                ).toLocaleDateString()}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading batch details...</p>
          </div>
        ) : payoutBatchDetails ? (
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payoutBatchDetails.payoutBatch.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800">
                      <Clock className="mr-2 h-4 w-4" />
                      Pending
                    </span>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(payoutBatchDetails.payoutBatch.totalAmount)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Payout Items ({payoutBatchDetails.payoutItems.length})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Distribution breakdown by staff member
                  </p>
                </div>
              </div>
              
              {payoutBatchDetails.payoutItems.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No payout items in this batch
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {payoutBatchDetails.payoutItems.map((item) => {
                    const staffMember = staffMap.get(item.staffProfileId);
                    return (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {staffMember?.displayName ||
                                    `Staff ${item.staffProfileId.slice(0, 8)}`}
                                </p>
                                {staffMember?.position && (
                                  <p className="text-sm text-muted-foreground">
                                    {staffMember.position}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-xl font-bold">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {payoutBatchDetails.payoutBatch.status === 'PENDING' && (
              <>
                <Separator />
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">
                        Batch pending completion
                      </p>
                      <p className="text-sm text-yellow-700">
                        Mark as completed once payments have been distributed
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCompletePayoutBatch}
                    disabled={completing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {completing ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Complete Batch
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
            <p className="text-sm text-muted-foreground">
              Failed to load payout batch details
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPayoutBatchDetails}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}