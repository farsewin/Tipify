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
import CreateStaffDialog from './dialogs/create-staff-dialog';
import QRCodeDialog from './dialogs/qr-code-dialog';
import EditStaffDialog from './dialogs/edit-staff-dialog';

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
  isCreateDialogOpen: boolean;
  onCreateDialogChange: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
}

export default function StaffTable({ staff, branches, companyId, isCreateDialogOpen, onCreateDialogChange, startTransition }: StaffTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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


  const branchMap = useMemo(() => {
    return new Map(branches.map(b => [b.id, b.name]));
  }, [branches]);

  const uniqueBranches = useMemo(() => {
    return branches.map(b => b.name).sort();
  }, [branches]);

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

      if (!res.ok) {
        toast.error(result.error || 'Failed to update staff');
        setLoading(false);
        return;
      }

      toast.success('Staff profile updated successfully');
      setIsEditDialogOpen(false);
      setEditingStaff(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update staff');
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

      if (!res.ok) {
        toast.error(result.error || 'Failed to create staff');
        setCreateLoading(false);
        return;
      }

      form.reset();
      toast.success('Staff profile created successfully!');
      onCreateDialogChange(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Create error:', err);
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

      if (!res.ok) {
        toast.error(result.error || 'Failed to update staff');
        setToggleLoading(null);
        return;
      }

      toast.success(`Staff profile ${member.active ? 'deactivated' : 'activated'} successfully`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Failed to update staff');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleGenerateQR = async (member: StaffMember) => {
    setQrCodeStaff(member);
    setQrData(null);
    setIsQRDialogOpen(true);
    
    // Automatically generate QR code when dialog opens
    setQrLoading(true);
    try {
      const res = await fetch(`/api/staff/${member.id}/qr?companyId=${companyId}`);
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to generate QR code');
        return;
      }

      if (result.url && result.dataUrl && result.svg) {
        setQrData(result);
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

  const handleGenerateQRCode = async () => {
    if (!qrCodeStaff) return;

    setQrLoading(true);
    try {
      const res = await fetch(`/api/staff/${qrCodeStaff.id}/qr?companyId=${companyId}`);
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to generate QR code');
        return;
      }

      if (result.url && result.dataUrl && result.svg) {
        setQrData(result);
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
      <EditStaffDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        staff={editingStaff}
        companyId={companyId}
        branches={branches}
        startTransition={startTransition}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={isQRDialogOpen}
        onOpenChange={setIsQRDialogOpen}
        staff={qrCodeStaff}
        companyId={companyId}
      />
 

      {/* Create Staff Dialog */}
      <CreateStaffDialog
        open={isCreateDialogOpen}
        onOpenChange={onCreateDialogChange}
        companyId={companyId}
        branches={branches}
        startTransition={startTransition}
      />
    </div>
  );
}
