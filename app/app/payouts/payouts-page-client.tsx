'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Filter,
  X,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Button } from '../../_components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../_components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../_components/ui/select';
import { toast } from 'sonner';
import type { Branch } from '@/src/models/branch.model';
import CreatePayoutDialog from './dialogs/create-payout-dialog';
import PayoutDetailsDialog from './dialogs/payout-details-dialog';

interface Staff {
  id: string;
  displayName: string;
  position?: string;
}

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
  staff: Staff[];
  payoutBatches: PayoutBatchListItem[];
  stats: {
    totalAmount: string;
    pendingAmount: string;
    completedAmount: string;
    totalCount: number;
    pendingCount: number;
    completedCount: number;
  };
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
  staff,
  payoutBatches: initialPayoutBatches,
  stats,
}: PayoutsPageClientProps) {
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilterList, setBranchFilterList] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('all');

  // Create lookup maps
  const branchMap = useMemo(() =>
    new Map(branches.map((b) => [b.id, b.name])),
    [branches]
  );

  // Filter payout batches
  const filteredPayoutBatches = useMemo(() => {
    return initialPayoutBatches.filter((batch) => {
      // Status filter
      if (statusFilter !== 'all' && batch.status !== statusFilter) {
        return false;
      }

      // Branch filter
      if (branchFilterList && batch.branchId !== branchFilterList) {
        return false;
      }

      // Date range filter
      if (dateRange !== 'all') {
        const batchDate = new Date(batch.payoutDate);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - batchDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateRange) {
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
        }
      }

      return true;
    });
  }, [initialPayoutBatches, statusFilter, branchFilterList, dateRange]);

  const hasActiveFilters = statusFilter !== 'all' || branchFilterList || dateRange !== 'all';

  const clearFilters = () => {
    setStatusFilter('all');
    setBranchFilterList(null);
    setDateRange('all');
  }; const handleViewDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsDetailsDialogOpen(true);
  }; const handleExportBatch = (batch: PayoutBatchListItem) => {
    // Export single batch details
    const csvData = [
      ['Payout Batch Export'],
      ['Date', new Date(batch.payoutDate).toLocaleDateString()],
      ['Branch', batch.branchId ? branchMap.get(batch.branchId) || 'Unknown' : 'All Branches'],
      ['Status', batch.status],
      ['Total Amount', formatCurrency(batch.totalAmount)],
      [],
      ['Created', new Date(batch.createdAt).toLocaleDateString()],
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-batch-${batch.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Batch exported successfully');
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payout Batches</h1>
          <p className="text-muted-foreground">
            Create and manage tip distribution batches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCount} batch{stats.totalCount !== 1 ? 'es' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAmount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount} batch{stats.pendingCount !== 1 ? 'es' : ''} awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAmount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCount} batch{stats.completedCount !== 1 ? 'es' : ''} paid out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('PENDING')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('COMPLETED')}>
              Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Branch Filter */}
        {branches.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Branch: {branchFilterList ? branchMap.get(branchFilterList) : 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBranchFilterList(null)}>
                All
              </DropdownMenuItem>
              {branches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => setBranchFilterList(branch.id)}
                >
                  {branch.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
          Showing {filteredPayoutBatches.length} of {initialPayoutBatches.length} batches
        </div>
      </div>

      {/* Payout Batches List */}
      {filteredPayoutBatches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasActiveFilters ? 'No batches match filters' : 'No payout batches yet'}
            </CardTitle>
            <CardDescription>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Create a payout batch from pending tips to track distributions.'}
            </CardDescription>
          </CardHeader>
          {!hasActiveFilters && (
            <CardContent>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Payout Batch
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayoutBatches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Batch #{batch.id.slice(0, 8)}
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
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Payout: {new Date(batch.payoutDate).toLocaleDateString()}
                        </span>
                        <span>
                          {batch.branchId
                            ? branchMap.get(batch.branchId) || 'Unknown Branch'
                            : 'All Branches'}
                        </span>
                      </div>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportBatch(batch)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(batch.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreatePayoutDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        companyId={companyId}
        branches={branches}
        staff={staff}
      />

      <PayoutDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        batchId={selectedBatchId}
        companyId={companyId}
        staff={staff}
      />
    </div>
  );
}