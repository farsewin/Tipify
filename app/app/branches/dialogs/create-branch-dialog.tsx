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

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  startTransition: (callback: () => void) => void;
}

export default function CreateBranchDialog({
  open,
  onOpenChange,
  companyId,
  startTransition,
}: CreateBranchDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
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
        setLoading(false);
        return;
      }

      form.reset();
      toast.success('Branch created successfully!');
      onOpenChange(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
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
  );
}