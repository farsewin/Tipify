'use client';

import { useState, useMemo, useEffect } from 'react';
import { Filter, X, User, CheckCircle2, XCircle, Settings, Edit, Power, QrCode, Download } from 'lucide-react';
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
import { Separator } from '../../_components/ui/separator';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface StaffMember {
  id: string;
  branchId: string;
  displayName: string;
  position: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StaffTableProps {
  staff: StaffMember[];
  branches: Array<{ id: string; name: string }>;
  companyId: string;
  openCreateDialog?: boolean;
  onOpenCreateDialogChange?: (open: boolean) => void;
}

export default function StaffTable({ staff, branches, companyId, openCreateDialog = false, onOpenCreateDialogChange }: StaffTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(openCreateDialog);
  const [qrCodeStaff, setQrCodeStaff] = useState<StaffMember | null>(null);
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

  // Sync external openCreateDialog prop with internal state
  useEffect(() => {
    setIsCreateDialogOpen(openCreateDialog);
  }, [openCreateDialog]);

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    onOpenCreateDialogChange?.(open);
  };

  // Create branch map
  const branchMap = useMemo(() => {
    return new Map(branches.map(b => [b.id, b.name]));
  }, [branches]);

  // Get unique branches for filter
  const uniqueBranches = useMemo(() => {
    return branches.map(b => b.name).sort();
  }, [branches]);

  // Apply filters
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      if (statusFilter) {
        if (statusFilter === 'active' && !member.active) return false;
        if (statusFilter === 'inactive' && member.active) return false;
      }
      if (branchFilter) {
        const branchName = branchMap.get(member.branchId);
        if (branchName !== branchFilter) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = member.displayName.toLowerCase().includes(query);
        const matchesPosition = member.position?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesPosition) return false;
      }
      return true;
    });
  }, [staff, statusFilter, branchFilter, searchQuery, branchMap]);

  const hasActiveFilters = statusFilter || branchFilter || searchQuery;

  const clearFilters = () => {
    setStatusFilter(null);
    setBranchFilter(null);
    setSearchQuery('');
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingStaff || loading) return;

    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          displayName: formData.get('displayName') as string,
          position: formData.get('position') as string || undefined,
          avatarUrl: formData.get('avatarUrl') as string || null,
          branchId: formData.get('branchId') as string,
        }),
      });
      
      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to update staff');
      } else if (result.success) {
        toast.success('Staff profile updated successfully');
        setIsEditDialogOpen(false);
        setEditingStaff(null);
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to update staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createLoading) return;

    setCreateLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          branchId: formData.get('branchId') as string,
          displayName: formData.get('displayName') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          position: formData.get('position') as string || undefined,
          avatarUrl: formData.get('avatarUrl') as string || undefined,
        }),
      });
      
      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to create staff');
      } else if (result.success) {
        toast.success('Staff profile created successfully!');
        handleCreateDialogChange(false);
        event.currentTarget.reset();
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to create staff');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    if (toggleLoading === member.id) return;

    setToggleLoading(member.id);

    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          active: !member.active,
        }),
      });
      
      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to update staff');
      } else if (result.success) {
        toast.success(`Staff profile ${member.active ? 'deactivated' : 'activated'} successfully`);
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to update staff');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleGenerateQR = (member: StaffMember) => {
    setQrCodeStaff(member);
    setQrData(null);
    setIsQRDialogOpen(true);
  };

  const handleGenerateQRCode = async () => {
    if (!qrCodeStaff) return;

    setQrLoading(true);
    try {
      const res = await fetch(`/api/staff/${qrCodeStaff.id}/qr?companyId=${companyId}`);
      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to generate QR code');
      } else if (result.url && result.dataUrl && result.svg) {
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
    if (!qrData || !qrCodeStaff) return;

    const link = document.createElement('a');
    link.href = qrData.dataUrl;
    link.download = `${qrCodeStaff.displayName}-qr-code.png`;
    link.click();
  };

  const handleDownloadSVG = () => {
    if (!qrData || !qrCodeStaff) return;

    const svgBlob = new Blob([qrData.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${qrCodeStaff.displayName}-qr-code.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const active = filteredStaff.filter(s => s.active).length;
    const inactive = filteredStaff.filter(s => !s.active).length;
    const byBranch = new Map<string, number>();

    filteredStaff.forEach(member => {
      const branchName = branchMap.get(member.branchId) || 'Unknown';
      byBranch.set(branchName, (byBranch.get(branchName) || 0) + 1);
    });

    return {
      total: filteredStaff.length,
      active,
      inactive,
      byBranch: Array.from(byBranch.entries()).map(([name, count]) => ({ name, count })),
    };
  }, [filteredStaff, branchMap]);

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <User className="h-8 w-8 text-muted-foreground" />
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
        {stats.byBranch.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Branches</p>
              <p className="text-2xl font-bold">{stats.byBranch.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.byBranch.map(b => `${b.name}: ${b.count}`).join(', ')}
              </p>
            </div>
          </div>
        )}
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

        {/* Search Input */}
        <Input
          placeholder="Search by name or position..."
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
          Showing {filteredStaff.length} of {staff.length} staff
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Staff</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Branch</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No staff match the current filters
                </td>
              </tr>
            ) : (
              filteredStaff.map((member) => {
                const branchName = branchMap.get(member.branchId) || 'Unknown';
                return (
                  <tr key={member.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <Image
                            src={member.avatarUrl}
                            alt={member.displayName}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{member.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {member.position || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{branchName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${member.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleGenerateQR(member)}
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
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(member)}
                              disabled={toggleLoading === member.id}
                            >
                              {toggleLoading === member.id ? (
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="mr-2 h-4 w-4" />
                              )}
                              {member.active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Staff Profile</DialogTitle>
              <DialogDescription>
                Update staff member information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {editingStaff && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      defaultValue={editingStaff.displayName}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      name="position"
                      defaultValue={editingStaff.position || ''}
                      maxLength={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      name="avatarUrl"
                      type="url"
                      defaultValue={editingStaff.avatarUrl || ''}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="branchId">Branch *</Label>
                    <select
                      id="branchId"
                      name="branchId"
                      required
                      defaultValue={editingStaff.branchId}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
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
              {qrCodeStaff ? `QR Code - ${qrCodeStaff.displayName}` : 'Generate QR Code'}
            </DialogTitle>
            <DialogDescription>
              Generate and download QR code for this staff member
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
                    alt={`QR Code for ${qrCodeStaff?.displayName || 'Staff'}`}
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

      {/* Create Staff Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Staff Profile</DialogTitle>
              <DialogDescription>
                Add a new staff member to your team
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-branchId">Branch *</Label>
                <select
                  id="create-branchId"
                  name="branchId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-displayName">Display Name *</Label>
                <Input
                  id="create-displayName"
                  name="displayName"
                  type="text"
                  placeholder="John Doe"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  This name will be shown to customers when they tip
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-position">Position</Label>
                <Input
                  id="create-position"
                  name="position"
                  type="text"
                  placeholder="Waiter, Barista, etc."
                  maxLength={100}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-avatarUrl">Avatar URL (Optional)</Label>
                <Input
                  id="create-avatarUrl"
                  name="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  URL to staff member&apos;s profile picture
                </p>
              </div>

              <Separator className="my-2" />
              <div className="text-sm font-medium">Account Credentials</div>
              <p className="text-xs text-muted-foreground">
                A user account will be created for this staff member to access their dashboard
              </p>

              <div className="grid gap-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  placeholder="staff@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Staff member&apos;s email address for login
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-password">Password *</Label>
                <Input
                  id="create-password"
                  name="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
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
              <Button type="submit" disabled={createLoading}>
                {createLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Staff Profile'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

