'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../_components/ui/button';
import { completePayoutBatch } from '../../actions';
import { toast } from 'sonner';

interface CompletePayoutBatchButtonProps {
  companyId: string;
  payoutBatchId: string;
}

export default function CompletePayoutBatchButton({
  companyId,
  payoutBatchId,
}: CompletePayoutBatchButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!confirm('Mark this payout batch as completed? This action cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const result = await completePayoutBatch(companyId, payoutBatchId);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success('Payout batch marked as completed!');
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Complete payout batch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleComplete} disabled={loading}>
      {loading ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Completed
        </>
      )}
    </Button>
  );
}







