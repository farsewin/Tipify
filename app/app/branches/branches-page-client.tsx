'use client';

import { useState, useTransition } from 'react';
import { Button } from '../../_components/ui/button';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import BranchesTable from './branches-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '../../_components/ui/card';

interface Branch {
  id: string;
  name: string;
  location: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  staffCount?: number;
  tipsCount?: number;
  totalTips?: number;
}

interface BranchesPageClientProps {
  branches: Branch[];
  companyId: string;
}

export default function BranchesPageClient({ branches, companyId }: BranchesPageClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="container mx-auto p-6 space-y-6 relative">
      {isPending && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Refreshing...</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage your company locations</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {/* Empty State or Branches List */}
      {branches.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mb-2">No branches yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Get started by creating your first branch location to manage your staff and track tips.
            </CardDescription>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Branch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <BranchesTable
          branches={branches}
          companyId={companyId}
          isCreateDialogOpen={isCreateDialogOpen}
          onCreateDialogChange={setIsCreateDialogOpen}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}