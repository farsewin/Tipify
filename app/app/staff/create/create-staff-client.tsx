'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { Separator } from '../../../_components/ui/separator';
import { createStaff } from '../../actions';
import { toast } from 'sonner';
import type { Branch } from '@/src/modules/branch/branch.model';

interface CreateStaffClientProps {
  companyId: string;
  branches: Branch[];
}

export default function CreateStaffClient({ companyId, branches }: CreateStaffClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const formData = new FormData(event.currentTarget);
    formData.append('companyId', companyId);

    setLoading(true);
    const res = await createStaff(formData);

    if (res?.error) {
      setError(res.error);
      toast.error(res.error);
    } else if (res?.success) {
      toast.success('Staff profile created successfully!');
      router.push('/app/staff');
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Staff Profile</CardTitle>
          <CardDescription>Add a new staff member to your team</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col p-6 gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              {error && <p className="text-destructive">{error}</p>}

              <div className="grid gap-2">
                <Label htmlFor="branchId">Branch *</Label>
                <select
                  id="branchId"
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
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
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
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  placeholder="Waiter, Barista, etc."
                  maxLength={100}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                <Input
                  id="avatarUrl"
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
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

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Staff Profile'
                  )}
                </Button>
                <Link href="/app/staff">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

