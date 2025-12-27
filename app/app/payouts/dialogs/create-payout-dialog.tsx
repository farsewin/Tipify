'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Users, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../_components/ui/dialog';
import { Button } from '../../../_components/ui/button';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { Separator } from '../../../_components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { toast } from 'sonner';
import type { Branch } from '@/src/models/branch.model';

interface Staff {
  id: string;
  displayName: string;
  position?: string;
}

interface Tip {
  id: string;
  branchId: string;
  staffProfileId: string;
  amount: number;
  createdAt: Date;
}

interface CreatePayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  branches: Branch[];
  staff: Staff[];
  startTransition: (callback: () => void) => void;
}

function formatCurrency(amount: number): string {
  const amountInUnits = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
  }).format(amountInUnits);
}

export default function CreatePayoutDialog({
  open,
  onOpenChange,
  companyId,
  branches,
  staff,
  startTransition,
}: CreatePayoutDialogProps) {
  const router = useRouter();
  
  // Form states
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedTipIds, setSelectedTipIds] = useState<Set<string>>(new Set());
  const [payoutDate, setPayoutDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Data states
  const [pendingTips, setPendingTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTips, setLoadingTips] = useState(false);

  // Create staff lookup map
  const staffMap = useMemo(() => 
    new Map(staff.map((s) => [s.id, s])),
    [staff]
  );

  // Load pending tips when dialog opens
  useEffect(() => {
    if (open) {
      loadPendingTips();
    } else {
      // Reset form when dialog closes
      setSelectedBranchId('');
      setSelectedTipIds(new Set());
      setPayoutDate(new Date().toISOString().split('T')[0]);
      setPendingTips([]);
    }
  }, [open]);

  const loadPendingTips = async () => {
    setLoadingTips(true);
    try {
      const res = await fetch(
        `/api/tips?companyId=${companyId}&distributionStatus=PENDING&paymentStatus=SUCCEEDED`
      );
      
      if (!res.ok) {
        throw new Error('Failed to fetch tips');
      }
      
      const data = await res.json();
      setPendingTips(data.tips || []);
    } catch (error) {
      toast.error('Failed to load pending tips');
      console.error('Load pending tips error:', error);
      setPendingTips([]);
    } finally {
      setLoadingTips(false);
    }
  };

  // Filter tips by selected branch
  const filteredTips = useMemo(() => 
    selectedBranchId
      ? pendingTips.filter((tip) => tip.branchId === selectedBranchId)
      : pendingTips,
    [pendingTips, selectedBranchId]
  );

  // Group tips by staff
  const tipsByStaff = useMemo(() => {
    const grouped = new Map<string, Tip[]>();
    filteredTips.forEach((tip) => {
      const existing = grouped.get(tip.staffProfileId) || [];
      existing.push(tip);
      grouped.set(tip.staffProfileId, existing);
    });
    return grouped;
  }, [filteredTips]);

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

    if (!payoutDate) {
      toast.error('Please select a payout date');
      return;
    }

    setLoading(true);

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
        onOpenChange(false);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Create payout batch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
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
                    setSelectedTipIds(new Set());
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    {loadingTips
                      ? 'Loading...'
                      : `${filteredTips.length} tip${filteredTips.length !== 1 ? 's' : ''} available`}
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
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No pending tips available
                    {selectedBranchId && ' for this branch'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Array.from(tipsByStaff.entries()).map(([staffId, tips]) => {
                    const staffTotal = tips.reduce((sum, t) => sum + t.amount, 0);
                    const selectedCount = tips.filter((t) =>
                      selectedTipIds.has(t.id)
                    ).length;
                    const allSelected = selectedCount === tips.length;
                    const staffMember = staffMap.get(staffId);

                    return (
                      <Card key={staffId}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {staffMember?.displayName || `Staff ${staffId.slice(0, 8)}`}
                              </CardTitle>
                              <CardDescription>
                                {staffMember?.position && (
                                  <span className="mr-2">{staffMember.position} •</span>
                                )}
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
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {tips.map((tip) => (
                              <div
                                key={tip.id}
                                className="flex items-center justify-between p-3 rounded border hover:bg-muted/50 transition-colors"
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
                                  className="h-4 w-4 rounded border-gray-300"
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
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Selected</p>
                    <p className="font-semibold">{selectedTipIds.size} tip{selectedTipIds.size !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculateTotal())}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={selectedTipIds.size === 0 || loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
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
  );
}