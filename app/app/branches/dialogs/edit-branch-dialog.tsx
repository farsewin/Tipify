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

interface EditBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  companyId: string;
  startTransition: (callback: () => void) => void;
}

export default function EditBranchDialog({
  open,
  onOpenChange,
  branch,
  companyId,
  startTransition,
}: EditBranchDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branch || loading) return;

    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
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
      onOpenChange(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update branch');
    } finally {
      setLoading(false);
    }
  };

  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Branch Name *</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={branch.name}
                required
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                name="location"
                defaultValue={branch.location || ''}
                maxLength={255}
              />
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