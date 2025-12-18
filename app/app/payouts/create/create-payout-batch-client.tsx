'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import Link from 'next/link';
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
import { Separator } from '../../../_components/ui/separator';
import { createPayoutBatch } from '../../actions';
import { toast } from 'sonner';
import type { Branch } from '@/src/modules/branch/branch.model';
import type { Tip } from '@/src/modules/tips/tip.model';

interface CreatePayoutBatchClientProps {
  companyId: string;
  branches: Branch[];
  pendingTips: Tip[];
  currency: string;
}

function formatCurrency(amount: number, currency: string): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default function CreatePayoutBatchClient({
  companyId,
  branches,
  pendingTips,
  currency,
}: CreatePayoutBatchClientProps) {
  const router = useRouter();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedTipIds, setSelectedTipIds] = useState<Set<string>>(new Set());
  const [payoutDate, setPayoutDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  // Filter tips by selected branch
  const filteredTips = selectedBranchId
    ? pendingTips.filter((tip) => tip.branchId === selectedBranchId)
    : pendingTips;

  // Group tips by staff
  const tipsByStaff = new Map<string, Tip[]>();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTipIds.size === 0) {
      toast.error('Please select at least one tip');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('companyId', companyId);
      if (selectedBranchId) formData.append('branchId', selectedBranchId);
      formData.append('payoutDate', payoutDate);
      formData.append('tipIds', Array.from(selectedTipIds).join(','));

      const result = await createPayoutBatch(formData);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success('Payout batch created successfully!');
        router.push('/app/payouts');
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Create payout batch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Payout Batch</CardTitle>
          <CardDescription>
            Select pending tips to include in this payout batch
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    {filteredTips.length} tip{filteredTips.length !== 1 ? 's' : ''} available
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

              {filteredTips.length === 0 ? (
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
                                {formatCurrency(staffTotal, currency)} total
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
                                    {formatCurrency(tip.amount, tip.currency)}
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
                    {formatCurrency(calculateTotal(), currency)}
                  </span>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={selectedTipIds.size === 0 || loading}>
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Payout Batch'
                )}
              </Button>
              <Link href="/app/payouts">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}







