import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container mx-auto p-6 lg:p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Dashboard</h1>
        <div className="h-6 w-48 bg-muted rounded animate-pulse mt-2" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <CardTitle className="mb-2">Loading dashboard...</CardTitle>
          <CardDescription className="text-center max-w-sm">
            Please wait while we fetch your dashboard data.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

