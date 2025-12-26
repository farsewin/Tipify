'use client';

import { useState, useMemo, useEffect } from 'react';
import { Filter, X, MapPin, CheckCircle2, XCircle, Edit, Power, QrCode, Download, MoreVertical, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../_components/ui/card';
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
import { toast } from 'sonner';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
  openCreateDialog?: boolean;
  onOpenCreateDialogChange?: (open: boolean) => void;
}

export default function BranchesTable({ branches, companyId, openCreateDialog = false, onOpenCreateDialogChange }: BranchesTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(openCreateDialog);
  const [qrCodeBranch, setQrCodeBranch] = useState<Branch | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrData, setQrData] = useState<{
    url: string;
    dataUrl: string;
    svg: string;
  } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  useEffect(() => {
    setIsCreateDialogOpen(openCreateDialog);
  }, [openCreateDialog]);

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    onOpenCreateDialogChange?.(open);
  };

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
    
    try {
      const res = await fetch(`/api/branches/${editingBranch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          name: formData.get('name') as string,
          location: formData.get('location') as string || null,
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        toast.error(result.error || 'Failed to update branch');
        setLoading(false);
        return;
      }
      
      toast.success('Branch updated successfully');
      setIsEditDialogOpen(false);
      setEditingBranch(null);
      router.refresh();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update branch');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createLoading) return;

    setCreateLoading(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          name: formData.get('name') as string,
          location: formData.get('location') as string || undefined,
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        toast.error(result.error || 'Failed to create branch');
        setCreateLoading(false);
        return;
      }
      
      form.reset();
      toast.success('Branch created successfully!');
      handleCreateDialogChange(false);
      router.refresh();
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Failed to create branch');
    } finally {
      setCreateLoading(false);
    }
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
      router.refresh();
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Failed to update branch');
    } finally {
      setToggleLoading(null);
    }
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
      const res = await fetch(`/api/branches/${qrCodeBranch.id}/qr?companyId=${companyId}`);
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to generate QR code');
        return;
      }
      
      if (result.url && result.dataUrl && result.svg) {
        setQrData(result);
        toast.success('QR code generated!');
      } else {
        toast.error('Invalid QR code response');
      }
    } catch (error) {
      console.error('QR generation error:', error);
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
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{branch.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          branch.active
                            ? 'bg-success/10 text-success'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {branch.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(branch)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Branch
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleGenerateQR(branch)}>
                      <QrCode className="mr-2 h-4 w-4" />
                      QR Code
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
              </CardHeader>

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
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-purple-600">
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
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-primary" />
                </div>
                <Button onClick={handleGenerateQRCode} disabled={qrLoading} className="bg-gradient-to-r from-primary to-purple-600">
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
                <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                  <Image
                    src={qrData.dataUrl}
                    alt={`QR Code for ${qrCodeBranch?.name || 'Branch'}`}
                    width={200}
                    height={200}
                    className="border rounded"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground break-all text-center bg-muted/30 p-2 rounded">
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

      {/* Create Branch Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New Branch</DialogTitle>
              <DialogDescription>
                Add a new location for your company
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Branch Name *</Label>
                <Input
                  id="create-name"
                  name="name"
                  type="text"
                  placeholder="Downtown Location"
                  required
                  maxLength={100}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-location">Location</Label>
                <Input
                  id="create-location"
                  name="location"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  maxLength={255}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCreateDialogChange(false)}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading} className="bg-gradient-to-r from-primary to-purple-600">
                {createLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Branch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}