'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { Button } from '../../../_components/ui/button';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { updatePassword } from '../../actions';
import { toast } from 'sonner';

export default function UpdatePasswordForm() {
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
      const form = new FormData();
      form.append('currentPassword', formData.currentPassword);
      form.append('newPassword', formData.newPassword);
      form.append('confirmPassword', formData.confirmPassword);

      const result = await updatePassword(form);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success('Password updated successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        router.refresh();
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







