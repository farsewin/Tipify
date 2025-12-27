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
import { Plus } from 'lucide-react';
import StaffTable from './staff-table';

interface StaffMember {
  id: string;
  branchId: string;
  displayName: string;
  position: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StaffPageClientProps {
  staff: StaffMember[];
  branches: Array<{ id: string; name: string }>;
  companyId: string;
}

export default function StaffPageClient({ staff, branches, companyId }: StaffPageClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-muted-foreground">Manage your staff profiles</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No staff yet</CardTitle>
            <CardDescription>
              Get started by creating your first staff profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Staff Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Staff</CardTitle>
            <CardDescription>
              {staff.length} staff member{staff.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffTable
              staff={staff}
              branches={branches}
              companyId={companyId}
              isCreateDialogOpen={isCreateDialogOpen}
              onCreateDialogChange={setIsCreateDialogOpen}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}



