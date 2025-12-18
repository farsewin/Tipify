'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { Button } from '../../../_components/ui/button';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { updateAccountSettings } from '../../actions';
import { toast } from 'sonner';
import type { User } from '@/src/modules/auth/user.model';

interface UpdateAccountFormProps {
  user: User;
}

export default function UpdateAccountForm({ user }: UpdateAccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('email', formData.email);

      const result = await updateAccountSettings(form);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success('Account settings updated successfully!');
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Update account error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

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
    </form>
  );
}







