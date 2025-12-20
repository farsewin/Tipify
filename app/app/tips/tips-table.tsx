'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Clock, XCircle, Star, Filter, X } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../_components/ui/dropdown-menu';
import { markTipsAsPaid } from '../../../src/actions/actions';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

interface Tip {
  id: string;
  branchName: string;
  staffName: string;
  formattedAmount: string;
  paymentStatus: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  distributionStatus: 'PENDING' | 'PAID';
  customerNote: string | null;
  customerRating: number | null;
  createdAt: Date;
}

interface TipsTableProps {
  tips: Tip[];
  companyId: string;
}

export default function TipsTable({ tips, companyId }: TipsTableProps) {
  const [selectedTips, setSelectedTips] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [distributionStatusFilter, setDistributionStatusFilter] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique branches and staff for filters
  const uniqueBranches = useMemo(() => {
    const branches = new Set(tips.map(tip => tip.branchName));
    return Array.from(branches).sort();
  }, [tips]);

  const uniqueStaff = useMemo(() => {
    const staff = new Set(tips.map(tip => tip.staffName));
    return Array.from(staff).sort();
  }, [tips]);

  // Apply filters
  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      if (paymentStatusFilter && tip.paymentStatus !== paymentStatusFilter) {
        return false;
      }
      if (distributionStatusFilter && tip.distributionStatus !== distributionStatusFilter) {
        return false;
      }
      if (branchFilter && tip.branchName !== branchFilter) {
        return false;
      }
      if (staffFilter && tip.staffName !== staffFilter) {
        return false;
      }
      if (searchQuery) {
        if (!tip.customerNote || !tip.customerNote.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [tips, paymentStatusFilter, distributionStatusFilter, branchFilter, staffFilter, searchQuery]);

  const pendingTips = filteredTips.filter(
    (tip) => tip.distributionStatus === 'PENDING' && tip.paymentStatus === 'SUCCEEDED'
  );

  const hasActiveFilters = paymentStatusFilter || distributionStatusFilter || branchFilter || staffFilter || searchQuery;

  const clearFilters = () => {
    setPaymentStatusFilter(null);
    setDistributionStatusFilter(null);
    setBranchFilter(null);
    setStaffFilter(null);
    setSearchQuery('');
  };

  const handleSelectTip = (tipId: string) => {
    const newSelected = new Set(selectedTips);
    if (newSelected.has(tipId)) {
      newSelected.delete(tipId);
    } else {
      newSelected.add(tipId);
    }
    setSelectedTips(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTips.size === pendingTips.length) {
      setSelectedTips(new Set());
    } else {
      setSelectedTips(new Set(pendingTips.map((t) => t.id)));
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedTips.size === 0) {
      toast.error('Please select at least one tip');
      return;
    }

    setLoading(true);
    try {
      const result = await markTipsAsPaid(companyId, Array.from(selectedTips));
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(`Marked ${selectedTips.size} tip(s) as paid`);
        setSelectedTips(new Set());
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to mark tips as paid');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Tip['paymentStatus']) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getDistributionBadge = (status: Tip['distributionStatus']) => {
    return status === 'PAID' ? (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        Paid
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Payment Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Payment: {paymentStatusFilter ? paymentStatusFilter : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Payment Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPaymentStatusFilter(null)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentStatusFilter('SUCCEEDED')}>
              Succeeded
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentStatusFilter('PENDING')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentStatusFilter('FAILED')}>
              Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Distribution Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Distribution: {distributionStatusFilter ? distributionStatusFilter : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Distribution Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDistributionStatusFilter(null)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDistributionStatusFilter('PENDING')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDistributionStatusFilter('PAID')}>
              Paid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Branch Filter */}
        {uniqueBranches.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Branch: {branchFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBranchFilter(null)}>
                All
              </DropdownMenuItem>
              {uniqueBranches.map((branch) => (
                <DropdownMenuItem
                  key={branch}
                  onClick={() => setBranchFilter(branch)}
                >
                  {branch}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Staff Filter */}
        {uniqueStaff.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Staff: {staffFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Staff</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStaffFilter(null)}>
                All
              </DropdownMenuItem>
              {uniqueStaff.map((staff) => (
                <DropdownMenuItem
                  key={staff}
                  onClick={() => setStaffFilter(staff)}
                >
                  {staff}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Search Input */}
        <Input
          placeholder="Search by note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-[200px]"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredTips.length} of {tips.length} tips
        </div>
      </div>

      {pendingTips.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTips.size} of {pendingTips.length} pending tips selected
          </div>
          <Button
            onClick={handleMarkAsPaid}
            disabled={selectedTips.size === 0 || loading}
            size="sm"
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Mark ${selectedTips.size || ''} as Paid`
            )}
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {pendingTips.length > 0 && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTips.size === pendingTips.length && pendingTips.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Branch</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Staff</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Payment</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Distribution</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {filteredTips.length === 0 ? (
              <tr>
                <td
                  colSpan={pendingTips.length > 0 ? 9 : 8}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No tips match the current filters
                </td>
              </tr>
            ) : (
              filteredTips.map((tip) => {
                const isPending = tip.distributionStatus === 'PENDING' && tip.paymentStatus === 'SUCCEEDED';
                return (
                <tr key={tip.id} className="border-b">
                  {pendingTips.length > 0 && (
                    <td className="px-4 py-3">
                      {isPending && (
                        <input
                          type="checkbox"
                          checked={selectedTips.has(tip.id)}
                          onChange={() => handleSelectTip(tip.id)}
                          className="rounded border-gray-300"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{tip.branchName}</td>
                  <td className="px-4 py-3 text-sm">{tip.staffName}</td>
                  <td className="px-4 py-3 text-sm font-medium">{tip.formattedAmount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tip.paymentStatus)}
                      <span className="text-sm capitalize">{tip.paymentStatus.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getDistributionBadge(tip.distributionStatus)}</td>
                  <td className="px-4 py-3">
                    {tip.customerRating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{tip.customerRating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {tip.customerNote || '-'}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

