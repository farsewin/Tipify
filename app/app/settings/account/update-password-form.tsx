'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { Button } from '../../../_components/ui/button';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { toast } from 'sonner';

interface UpdatePasswordFormProps {
  startTransition?: (callback: () => void) => void;
}

export default function UpdatePasswordForm({ startTransition: propStartTransition }: UpdatePasswordFormProps) {
  const [_, localStartTransition] = useTransition();
  const startTransition = propStartTransition || localStartTransition;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to update password');
      } else if (result.success) {
        toast.success('Password updated successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Update password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password *</Label>
        <Input
          id="currentPassword"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password *</Label>
        <Input
          id="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters long
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          minLength={8}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Password'
        )}
      </Button>
    </form>
  );
}







