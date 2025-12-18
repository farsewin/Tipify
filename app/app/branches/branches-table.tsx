'use client';

import { useState, useMemo } from 'react';
import { Filter, X, MapPin, CheckCircle2, XCircle, Settings, Edit, Power, QrCode, Download } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../_components/ui/dialog';
import { Label } from '../../_components/ui/label';
import { updateBranch, generateBranchQR } from '../actions';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Branch {
  id: string;
  name: string;
  location: string | null;
  timezone: string;
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
  currency: string;
}

export default function BranchesTable({ branches, companyId, currency }: BranchesTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [qrCodeBranch, setQrCodeBranch] = useState<Branch | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrData, setQrData] = useState<{
    url: string;
    dataUrl: string;
    svg: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Apply filters
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

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBranch || loading) return;

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.append('branchId', editingBranch.id);
    formData.append('companyId', companyId);

    const result = await updateBranch(formData);
    
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success('Branch updated successfully');
      setIsEditDialogOpen(false);
      setEditingBranch(null);
      router.refresh();
    }
    
    setLoading(false);
  };

  const handleToggleActive = async (branch: Branch) => {
    if (toggleLoading === branch.id) return;
    
    setToggleLoading(branch.id);
    const formData = new FormData();
    formData.append('branchId', branch.id);
    formData.append('companyId', companyId);
    formData.append('active', (!branch.active).toString());

    const result = await updateBranch(formData);
    
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success(`Branch ${branch.active ? 'deactivated' : 'activated'} successfully`);
      router.refresh();
    }
    
    setToggleLoading(null);
  };

  const handleGenerateQR = (branch: Branch) => {
    setQrCodeBranch(branch);
    setQrData(null);
    setIsQRDialogOpen(true);
  };

  const handleGenerateQRCode = async () => {
    if (!qrCodeBranch) return;
    
    setQrLoading(true);
    try {
      const result = await generateBranchQR(companyId, qrCodeBranch.id);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.url && result?.dataUrl && result?.svg) {
        setQrData(result);
        toast.success('QR code generated!');
      }
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrData || !qrCodeBranch) return;

    const link = document.createElement('a');
    link.href = qrData.dataUrl;
    link.download = `${qrCodeBranch.name}-qr-code.png`;
    link.click();
  };

  const handleDownloadSVG = () => {
    if (!qrData || !qrCodeBranch) return;

    const svgBlob = new Blob([qrData.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${qrCodeBranch.name}-qr-code.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number): string => {
    const amountInUnits = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUnits);
  };

  // Calculate statistics
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
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Branches</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-500" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{stats.totalStaff}</p>
            </div>
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
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

        {/* Search Input */}
        <Input
          placeholder="Search by name or location..."
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
          Showing {filteredBranches.length} of {branches.length} branches
        </div>
      </div>

      {/* Branches Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Branch</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Timezone</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Staff</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Tips (30d)</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Revenue (30d)</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No branches match the current filters
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr key={branch.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="font-medium">{branch.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {branch.location || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{branch.timezone}</td>
                  <td className="px-4 py-3 text-sm">{branch.staffCount || 0}</td>
                  <td className="px-4 py-3 text-sm">{branch.tipsCount || 0}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {branch.totalTips ? formatCurrency(branch.totalTips) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        branch.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {branch.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleGenerateQR(branch)}
                        title="Generate QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(branch)}>
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Branch</DialogTitle>
              <DialogDescription>
                Update branch information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {editingBranch && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Branch Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingBranch.name}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={editingBranch.location || ''}
                      maxLength={255}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone *</Label>
                    <Input
                      id="timezone"
                      name="timezone"
                      defaultValue={editingBranch.timezone}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {qrCodeBranch ? `QR Code - ${qrCodeBranch.name}` : 'Generate QR Code'}
            </DialogTitle>
            <DialogDescription>
              Generate and download QR code for this branch
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!qrData ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <QrCode className="h-12 w-12 text-muted-foreground" />
                <Button onClick={handleGenerateQRCode} disabled={qrLoading}>
                  {qrLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Image
                    src={qrData.dataUrl}
                    alt={`QR Code for ${qrCodeBranch?.name || 'Branch'}`}
                    width={200}
                    height={200}
                    className="border rounded"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground break-all text-center">
                    {qrData.url}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPNG}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PNG
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSVG}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      SVG
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQrData(null)}
                    className="w-full"
                  >
                    Generate New
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

