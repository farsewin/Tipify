'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';
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

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  companyId: string;
  branches: Array<{ id: string; name: string }>;
  startTransition: (callback: () => void) => void;
}

export default function EditStaffDialog({
  open,
  onOpenChange,
  staff,
  companyId,
  branches,
  startTransition,
}: EditStaffDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!staff || loading) return;

    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
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
      onOpenChange(false);
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

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Staff Profile</DialogTitle>
            <DialogDescription>
              Update staff member information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-displayName">Display Name *</Label>
              <Input
                id="edit-displayName"
                name="displayName"
                defaultValue={staff.displayName}
                required
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-position">Position</Label>
              <Input
                id="edit-position"
                name="position"
                defaultValue={staff.position || ''}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-avatarUrl">Avatar URL</Label>
              <Input
                id="edit-avatarUrl"
                name="avatarUrl"
                type="url"
                defaultValue={staff.avatarUrl || ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-branchId">Branch *</Label>
              <select
                id="edit-branchId"
                name="branchId"
                required
                defaultValue={staff.branchId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
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
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
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
  );
}