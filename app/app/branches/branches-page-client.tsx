'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { Button } from '../../_components/ui/button';
import { Plus, MapPin } from 'lucide-react';
import BranchesTable from './branches-table';

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage your company locations</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
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
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
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
          openCreateDialog={isCreateDialogOpen}
          onOpenCreateDialogChange={setIsCreateDialogOpen}
        />
      )}
    </div>
  );
}