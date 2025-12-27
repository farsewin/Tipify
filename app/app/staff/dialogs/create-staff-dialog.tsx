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
import { Separator } from '@radix-ui/react-separator';

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  branches: Array<{ id: string; name: string }>;
}

export default function CreateStaffDialog({
  open,
  onOpenChange,
  companyId,
  branches,
}: CreateStaffDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          branchId: formData.get('branchId'),
          displayName: formData.get('displayName'),
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to create staff');
        return;
      }

      toast.success('Staff profile created successfully!');
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Failed to create staff');
    } finally {
      setLoading(false);
    }
  }; // ✅ handleSubmit properly closed

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit}>
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
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
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

  );
}
