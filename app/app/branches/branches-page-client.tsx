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
import { Plus, MapPin, Users, DollarSign, TrendingUp } from 'lucide-react';
import BranchesTable from './branches-table';

interface Branch {
  id: string;
  name: string;
  location: string | null;
  timezone: string;
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
  currency: string;
}

export default function BranchesPageClient({ branches, companyId, currency }: BranchesPageClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  function formatCurrency(amount: number, currency: string): string {
    const amountInUnits = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInUnits);
  }

  // Calculate overall stats
  const totalStaff = branches.reduce((sum, b) => sum + (b.staffCount || 0), 0);
  const totalTips = branches.reduce((sum, b) => sum + (b.totalTips || 0), 0);
  const activeBranches = branches.filter(b => b.active).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage your company locations</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {/* Overview Stats */}
      {branches.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeBranches} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStaff}</div>
              <p className="text-xs text-muted-foreground">
                Across all branches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tips (30d)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalTips, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Branch</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(branches.length > 0 ? totalTips / branches.length : 0, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per location
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {branches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No branches yet</CardTitle>
            <CardDescription>
              Get started by creating your first branch location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Branch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Branches</CardTitle>
            <CardDescription>
              {branches.length} branch{branches.length !== 1 ? 'es' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BranchesTable
              branches={branches}
              companyId={companyId}
              currency={currency}
              openCreateDialog={isCreateDialogOpen}
              onOpenCreateDialogChange={setIsCreateDialogOpen}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}




