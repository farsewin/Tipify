'use client';

import { useState, useMemo } from 'react';
import { Filter, X, MapPin, CheckCircle2, Edit, Power, QrCode, MoreVertical, Users, TrendingUp } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import { Card, CardContent } from '../../_components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../_components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateBranchDialog from './dialogs/create-branch-dialog';
import EditBranchDialog from './dialogs/edit-branch-dialog';
import QRCodeDialog from './dialogs/qr-code-dialog';

interface Branch {
  id: string;
  name: string;
  location: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  staffCount?: number;
  tipsCount?: number;
  totalTips?: number;
}

interface BranchesTableProps {
  branches: Branch[];
  companyId: string;
  isCreateDialogOpen: boolean;
  onCreateDialogChange: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
}

export default function BranchesTable({
  branches,
  companyId,
  isCreateDialogOpen,
  onCreateDialogChange,
  startTransition
}: BranchesTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [qrCodeBranch, setQrCodeBranch] = useState<Branch | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (statusFilter) {
        if (statusFilter === 'active' && !branch.active) return false;
        if (statusFilter === 'inactive' && branch.active) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = branch.name.toLowerCase().includes(query);
        const matchesLocation = branch.location?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesLocation) return false;
      }
      return true;
    });
  }, [branches, statusFilter, searchQuery]);

  const hasActiveFilters = statusFilter || searchQuery;

  const clearFilters = () => {
    setStatusFilter(null);
    setSearchQuery('');
  };

  const handleToggleActive = async (branch: Branch) => {
    if (toggleLoading === branch.id) return;

    setToggleLoading(branch.id);

    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          active: !branch.active,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to update branch');
        setToggleLoading(null);
        return;
      }

      toast.success(`Branch ${branch.active ? 'deactivated' : 'activated'} successfully`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Failed to update branch');
    } finally {
      setToggleLoading(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    const amountInUnits = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUnits);
  };

  const stats = useMemo(() => {
    const active = filteredBranches.filter(b => b.active).length;
    const inactive = filteredBranches.filter(b => !b.active).length;
    const totalStaff = filteredBranches.reduce((sum, b) => sum + (b.staffCount || 0), 0);
    const totalTips = filteredBranches.reduce((sum, b) => sum + (b.totalTips || 0), 0);

    return {
      total: filteredBranches.length,
      active,
      inactive,
      totalStaff,
      totalTips,
    };
  }, [filteredBranches]);

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Branches</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold mt-1">{stats.totalStaff}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tips (30d)</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalTips)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Status: {statusFilter ? statusFilter : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          placeholder="Search by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-[200px]"
        />

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

        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredBranches.length} of {branches.length} branches
        </div>
      </div>

      {/* Branch Cards */}
      {filteredBranches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No branches found</p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Get started by creating your first branch'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className="border-border hover:shadow-lg transition-all group hover:border-primary/50">
              <div className="flex flex-row items-start justify-between space-y-0 pb-4 p-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{branch.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${branch.active
                            ? 'bg-success/10 text-success'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {branch.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQrCodeBranch(branch)}
                    title="Generate QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingBranch(branch)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Branch
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(branch)}
                        disabled={toggleLoading === branch.id}
                      >
                        {toggleLoading === branch.id ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="mr-2 h-4 w-4" />
                        )}
                        {branch.active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {branch.location && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{branch.location}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Staff</p>
                        <p className="text-sm font-semibold">{branch.staffCount || 0}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Tips (30d)</p>
                      <p className="text-sm font-semibold">{branch.tipsCount || 0}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Revenue (30d)</span>
                      <span className="text-lg font-bold text-success">
                        {branch.totalTips ? formatCurrency(branch.totalTips) : 'QAR 0'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateBranchDialog
        open={isCreateDialogOpen}
        onOpenChange={onCreateDialogChange}
        companyId={companyId}
        startTransition={startTransition}
      />

      <EditBranchDialog
        open={!!editingBranch}
        onOpenChange={(open) => !open && setEditingBranch(null)}
        branch={editingBranch}
        companyId={companyId}
        startTransition={startTransition}
      />
      <QRCodeDialog
        open={!!qrCodeBranch}
        onOpenChange={(open) => !open && setQrCodeBranch(null)}
        branch={qrCodeBranch}
        companyId={companyId}
      />
    </div>

  );
}