import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '../../../_components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <CardTitle className="mb-2">Loading tipping page...</CardTitle>
          <CardDescription className="text-center max-w-sm">
            Please wait while we load the branch information and staff members.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

