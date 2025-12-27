'use client';

import { useEffect } from 'react';
import { Button } from '../../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '../../../_components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Payment success page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="mb-2 text-destructive">Something went wrong!</CardTitle>
          <CardDescription className="mb-6 text-center max-w-sm">
            We encountered an error while loading your payment confirmation. Please try again.
          </CardDescription>
          <Button onClick={reset} variant="default">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

