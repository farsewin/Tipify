import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '../../_components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">Manage payout batches and distributions</p>
        </div>
        <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Loading State */}
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <CardTitle className="mb-2">Loading payouts...</CardTitle>
          <CardDescription className="text-center max-w-sm">
            Please wait while we fetch your payout information.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

