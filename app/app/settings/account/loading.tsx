import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      {/* Header Skeleton */}
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Loading State */}
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <CardTitle className="mb-2">Loading account settings...</CardTitle>
          <CardDescription className="text-center max-w-sm">
            Please wait while we fetch your account information.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

