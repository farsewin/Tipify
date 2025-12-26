'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Plus, CheckCircle2, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Button } from '../../_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../_components/ui/dialog';
import { Input } from '../../_components/ui/input';
import { Label } from '../../_components/ui/label';
import { Separator } from '../../_components/ui/separator';
import { toast } from 'sonner';
import type { Branch } from '@/src/models/branch.model';
import type { PayoutBatch } from '@/src/models/payout-batch.model';

interface PayoutBatchListItem {
  id: string;
  branchId: string | null;
  payoutDate: Date;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED';
  createdAt: Date;
}

interface PayoutsPageClientProps {
  companyId: string;
  branches: Branch[];
  payoutBatches: PayoutBatchListItem[];
}

function formatCurrency(amount: number): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default function PayoutsPageClient({
  companyId,
  branches,
  payoutBatches: initialPayoutBatches,
}: PayoutsPageClientProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [payoutBatchDetails, setPayoutBatchDetails] = useState<any>(null);
  const [staffMap, setStaffMap] = useState<Map<string, any>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Create dialog state
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedTipIds, setSelectedTipIds] = useState<Set<string>>(new Set());
  const [payoutDate, setPayoutDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [pendingTips, setPendingTips] = useState<any[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Load pending tips when create dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      loadPendingTips();
    } else {
      // Reset form when dialog closes
      setSelectedBranchId('');
      setSelectedTipIds(new Set());
      setPayoutDate(new Date().toISOString().split('T')[0]);
    }
  }, [isCreateDialogOpen]);

  const loadPendingTips = async () => {
    setLoadingTips(true);
    try {
      const res = await fetch(`/api/tips?companyId=${companyId}&distributionStatus=PENDING&paymentStatus=SUCCEEDED`);
      const data = await res.json();
      setPendingTips(data.tips || []);
    } catch (error) {
      toast.error('Failed to load pending tips');
      console.error('Load pending tips error:', error);
    } finally {
      setLoadingTips(false);
    }
  };

  // Load payout batch details when details dialog opens
  useEffect(() => {
    if (isDetailsDialogOpen && selectedBatchId) {
      loadPayoutBatchDetails();
    }
  }, [isDetailsDialogOpen, selectedBatchId]);

  const loadPayoutBatchDetails = async () => {
    if (!selectedBatchId) return;
    
    setLoadingDetails(true);
    try {
      const [detailsRes, staffRes] = await Promise.all([
        fetch(`/api/payouts/${selectedBatchId}?companyId=${companyId}`),
        fetch(`/api/staff?companyId=${companyId}`),
      ]);
      const details = await detailsRes.json();
      const staffData = await staffRes.json();
      setPayoutBatchDetails(details);
      const map = new Map(staffData.staff.map((s: any) => [s.id, s]));
      setStaffMap(map);
    } catch (error) {
      toast.error('Failed to load payout batch details');
      console.error('Load payout batch details error:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsDetailsDialogOpen(true);
  };

  // Filter tips by selected branch
  const filteredTips = selectedBranchId
    ? pendingTips.filter((tip) => tip.branchId === selectedBranchId)
    : pendingTips;

  // Group tips by staff
  const tipsByStaff = new Map<string, any[]>();
  filteredTips.forEach((tip) => {
    const existing = tipsByStaff.get(tip.staffProfileId) || [];
    existing.push(tip);
    tipsByStaff.set(tip.staffProfileId, existing);
  });

  const handleSelectAll = () => {
    if (selectedTipIds.size === filteredTips.length) {
      setSelectedTipIds(new Set());
    } else {
      setSelectedTipIds(new Set(filteredTips.map((t) => t.id)));
    }
  };

  const handleSelectTip = (tipId: string) => {
    const newSelected = new Set(selectedTipIds);
    if (newSelected.has(tipId)) {
      newSelected.delete(tipId);
    } else {
      newSelected.add(tipId);
    }
    setSelectedTipIds(newSelected);
  };

  const calculateTotal = () => {
    return Array.from(selectedTipIds).reduce((sum, tipId) => {
      const tip = filteredTips.find((t) => t.id === tipId);
      return sum + (tip?.amount || 0);
    }, 0);
  };

  const handleCreatePayoutBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTipIds.size === 0) {
      toast.error('Please select at least one tip');
      return;
    }

    setCreateLoading(true);

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          branchId: selectedBranchId || undefined,
          payoutDate: payoutDate,
          tipIds: Array.from(selectedTipIds),
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to create payout batch');
      } else if (result.success) {
        toast.success('Payout batch created successfully!');
        setIsCreateDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Create payout batch error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCompletePayoutBatch = async () => {
    if (!selectedBatchId) return;
    
    if (!confirm('Mark this payout batch as completed? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/payouts/${selectedBatchId}?companyId=${companyId}`, {
        method: 'PATCH',
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to complete payout batch');
      } else if (result.success) {
        toast.success('Payout batch marked as completed!');
        setIsDetailsDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Complete payout batch error:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payout Batches</h1>
          <p className="text-muted-foreground">
            Manage tip distributions to staff members
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Payout Batch
        </Button>
      </div>

      {initialPayoutBatches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No payout batches yet</CardTitle>
            <CardDescription>
              Create a payout batch from pending tips to track distributions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Payout Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {initialPayoutBatches.map((batch) => (
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
                      {formatCurrency(batch.totalAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(batch.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => handleViewDetails(batch.id)}>
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Payout Batch Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreatePayoutBatch}>
            <DialogHeader>
              <DialogTitle>Create Payout Batch</DialogTitle>
              <DialogDescription>
                Select pending tips to include in this payout batch
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="branchId">Branch (Optional)</Label>
                  <select
                    id="branchId"
                    value={selectedBranchId}
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      setSelectedTipIds(new Set()); // Clear selection when branch changes
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payoutDate">Payout Date *</Label>
                  <Input
                    id="payoutDate"
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Pending Tips</h3>
                    <p className="text-sm text-muted-foreground">
                      {loadingTips ? 'Loading...' : `${filteredTips.length} tip${filteredTips.length !== 1 ? 's' : ''} available`}
                    </p>
                  </div>
                  {filteredTips.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedTipIds.size === filteredTips.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  )}
                </div>

                {loadingTips ? (
                  <div className="flex justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredTips.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No pending tips available
                    {selectedBranchId && ' for this branch'}
                  </p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Array.from(tipsByStaff.entries()).map(([staffId, tips]) => {
                      const staffTotal = tips.reduce((sum, t) => sum + t.amount, 0);
                      const selectedCount = tips.filter((t) =>
                        selectedTipIds.has(t.id)
                      ).length;
                      const allSelected = selectedCount === tips.length;

                      return (
                        <Card key={staffId}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  Staff ID: {staffId.slice(0, 8)}...
                                </CardTitle>
                                <CardDescription>
                                  {tips.length} tip{tips.length !== 1 ? 's' : ''} •{' '}
                                  {formatCurrency(staffTotal)} total
                                </CardDescription>
                              </div>
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => {
                                  if (allSelected) {
                                    const newSelected = new Set(selectedTipIds);
                                    tips.forEach((t) => newSelected.delete(t.id));
                                    setSelectedTipIds(newSelected);
                                  } else {
                                    const newSelected = new Set(selectedTipIds);
                                    tips.forEach((t) => newSelected.add(t.id));
                                    setSelectedTipIds(newSelected);
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {tips.map((tip) => (
                                <div
                                  key={tip.id}
                                  className="flex items-center justify-between p-2 rounded border"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {formatCurrency(tip.amount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(tip.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={selectedTipIds.has(tip.id)}
                                    onChange={() => handleSelectTip(tip.id)}
                                    className="rounded border-gray-300"
                                  />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedTipIds.size > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-semibold">Total Selected:</span>
                    <span className="text-2xl font-bold">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={selectedTipIds.size === 0 || createLoading}>
                {createLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Payout Batch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout Batch Details</DialogTitle>
            <DialogDescription>
              {payoutBatchDetails?.payoutBatch && (
                <>
                  Payout Date:{' '}
                  {new Date(
                    payoutBatchDetails.payoutBatch.payoutDate
                  ).toLocaleDateString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : payoutBatchDetails ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {payoutBatchDetails.payoutBatch.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 mt-2">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 mt-2">
                      <Clock className="mr-2 h-4 w-4" />
                      Pending
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      payoutBatchDetails.payoutBatch.totalAmount
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">
                  Payout Items ({payoutBatchDetails.payoutItems.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {payoutBatchDetails.payoutItems.map((item: any) => {
                    const staffMember = staffMap.get(item.staffProfileId);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
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
                        <p className="text-lg font-semibold">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {payoutBatchDetails.payoutBatch.status === 'PENDING' && (
                <div className="pt-4 border-t">
                  <Button onClick={handleCompletePayoutBatch}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load payout batch details
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

