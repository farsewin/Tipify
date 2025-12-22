'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { Button } from '../../../_components/ui/button';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { toast } from 'sonner';
import type { Company } from '@/src/models/company.model';

interface UpdateCompanyFormProps {
  company: Company;
}

export default function UpdateCompanyForm({ company }: UpdateCompanyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name,
    legalName: company.legalName || '',
    country: company.country,
    currency: company.currency,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/companies/${company.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          legalName: formData.legalName || undefined,
          country: formData.country,
          currency: formData.currency,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to update company settings');
      } else if (result.success) {
        toast.success('Company settings updated successfully!');
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Update company error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="legalName">Legal Name</Label>
        <Input
          id="legalName"
          value={formData.legalName}
          onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
          maxLength={200}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country Code *</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
            required
            maxLength={2}
            placeholder="QA"
          />
          <p className="text-xs text-muted-foreground">ISO 3166-1 alpha-2 code (e.g., QA, US)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
            required
            maxLength={3}
            placeholder="QAR"
          />
          <p className="text-xs text-muted-foreground">ISO 4217 code (e.g., QAR, USD)</p>
        </div>
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







