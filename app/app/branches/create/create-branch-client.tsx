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
import { createBranch } from '../../actions';
import { toast } from 'sonner';

interface CreateBranchClientProps {
  companyId: string;
}

export default function CreateBranchClient({ companyId }: CreateBranchClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const formData = new FormData(event.currentTarget);
    formData.append('companyId', companyId);

    setLoading(true);
    const res = await createBranch(formData);
    
    if (res?.error) {
      setError(res.error);
      toast.error(res.error);
    } else if (res?.success) {
      toast.success('Branch created successfully!');
      router.push('/app/branches');
      router.refresh();
    }
    
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Branch</CardTitle>
          <CardDescription>Add a new location for your company</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col p-6 gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              {error && <p className="text-destructive">{error}</p>}
              
              <div className="grid gap-2">
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Downtown Location"
                  required
                  maxLength={100}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  maxLength={255}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  type="text"
                  placeholder="UTC"
                  defaultValue="UTC"
                />
                <p className="text-xs text-muted-foreground">
                  IANA timezone (e.g., America/New_York, Europe/London)
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
                    'Create Branch'
                  )}
                </Button>
                <Link href="/app/branches">
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

