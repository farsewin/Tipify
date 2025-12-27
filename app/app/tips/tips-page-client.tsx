'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Clock, XCircle, Star, Filter, X, Download, FileText, Calendar } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../_components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../_components/ui/select';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

interface Tip {
  id: string;
  branchId: string;
  staffProfileId: string;
  branchName: string;
  staffName: string;
  formattedAmount: string;
  amount: number;
  paymentStatus: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  distributionStatus: 'PENDING' | 'PAID';
  customerNote: string | null;
  customerRating: number | null;
  createdAt: Date;
}

interface Branch {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  displayName: string;
  position?: string;
}

interface TipsPageClientProps {
  companyId: string;
  tips: Tip[];
  branches: Branch[];
  staff: Staff[];
  stats: {
    totalAmount: string;
    pendingAmount: string;
    paidAmount: string;
    totalCount: number;
    pendingCount: number;
    paidCount: number;
  };
}

export default function TipsPageClient({ 
  companyId, 
  tips, 
  branches, 
  staff, 
  stats 
}: TipsPageClientProps) {
  const [selectedTips, setSelectedTips] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [distributionStatusFilter, setDistributionStatusFilter] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');

  // Get unique branches and staff for filters
  const uniqueBranches = useMemo(() => {
    const branches = new Set(tips.map(tip => tip.branchName));
    return Array.from(branches).sort();
  }, [tips]);

  const uniqueStaff = useMemo(() => {
    const staff = new Set(tips.map(tip => tip.staffName));
    return Array.from(staff).sort();
  }, [tips]);

  // Apply filters including date range
  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      // Payment status filter
      if (paymentStatusFilter && tip.paymentStatus !== paymentStatusFilter) {
        return false;
      }
      // Distribution status filter
      if (distributionStatusFilter && tip.distributionStatus !== distributionStatusFilter) {
        return false;
      }
      // Branch filter
      if (branchFilter && tip.branchName !== branchFilter) {
        return false;
      }
      // Staff filter
      if (staffFilter && tip.staffName !== staffFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery) {
        if (!tip.customerNote || !tip.customerNote.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      // Date range filter
      if (dateRange !== 'all') {
        const tipDate = new Date(tip.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - tipDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateRange) {
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
          case 'quarter':
            if (daysDiff > 90) return false;
            break;
          case 'year':
            if (daysDiff > 365) return false;
            break;
        }
      }
      return true;
    });
  }, [tips, paymentStatusFilter, distributionStatusFilter, branchFilter, staffFilter, searchQuery, dateRange]);

  const pendingTips = filteredTips.filter(
    (tip) => tip.distributionStatus === 'PENDING' && tip.paymentStatus === 'SUCCEEDED'
  );

  const hasActiveFilters = paymentStatusFilter || distributionStatusFilter || branchFilter || staffFilter || searchQuery || dateRange !== 'all';

  const clearFilters = () => {
    setPaymentStatusFilter(null);
    setDistributionStatusFilter(null);
    setBranchFilter(null);
    setStaffFilter(null);
    setSearchQuery('');
    setDateRange('all');
  };

  const handleSelectTip = (tipId: string) => {
    const newSelected = new Set(selectedTips);
    if (newSelected.has(tipId)) {
      newSelected.delete(tipId);
    } else {
      newSelected.add(tipId);
    }
    setSelectedTips(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTips.size === pendingTips.length) {
      setSelectedTips(new Set());
    } else {
      setSelectedTips(new Set(pendingTips.map((t) => t.id)));
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedTips.size === 0) {
      toast.error('Please select at least one tip');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/tips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          tipIds: Array.from(selectedTips),
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        toast.error(result.error || 'Failed to mark tips as paid');
      } else if (result.success) {
        toast.success(`Marked ${selectedTips.size} tip(s) as paid`);
        setSelectedTips(new Set());
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to mark tips as paid');
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Date', 'Branch', 'Staff', 'Amount', 'Payment Status', 'Distribution Status', 'Rating', 'Note'];
    const csvData = filteredTips.map(tip => [
      new Date(tip.createdAt).toLocaleDateString(),
      tip.branchName,
      tip.staffName,
      tip.formattedAmount,
      tip.paymentStatus,
      tip.distributionStatus,
      tip.customerRating || '',
      tip.customerNote || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tips-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const handleExportPayroll = () => {
    // Group tips by staff
    const staffTotals = new Map<string, { name: string; total: number; count: number }>();
    
    filteredTips.forEach(tip => {
      if (tip.paymentStatus === 'SUCCEEDED') {
        const existing = staffTotals.get(tip.staffProfileId) || { name: tip.staffName, total: 0, count: 0 };
        existing.total += tip.amount;
        existing.count += 1;
        staffTotals.set(tip.staffProfileId, existing);
      }
    });

    const headers = ['Staff Name', 'Total Tips (QAR)', 'Number of Tips', 'Average Tip (QAR)'];
    const csvData = Array.from(staffTotals.values()).map(staff => [
      staff.name,
      (staff.total / 100).toFixed(2),
      staff.count,
      (staff.total / 100 / staff.count).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Payroll export completed');
  };

  const getStatusIcon = (status: Tip['paymentStatus']) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getDistributionBadge = (status: Tip['distributionStatus']) => {
    return status === 'PAID' ? (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        Paid
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        Pending
      </span>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tips & Reports</h1>
          <p className="text-muted-foreground">Monitor tips and export reports for payroll</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card 
          className="border-border hover:shadow-md transition-shadow cursor-pointer group"
          onClick={handleExportCSV}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Export CSV</h3>
              <p className="text-sm text-muted-foreground">Spreadsheet format</p>
            </div>
            <Download className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card 
          className="border-border hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => toast.info('PDF export coming soon')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Export PDF</h3>
              <p className="text-sm text-muted-foreground">Printable report</p>
            </div>
            <Download className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card 
          className="border-border hover:shadow-md transition-shadow cursor-pointer group"
          onClick={handleExportPayroll}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Payroll Export</h3>
              <p className="text-sm text-muted-foreground">Staff earnings summary</p>
            </div>
            <Download className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount}</div>
            <p className="text-xs text-muted-foreground">{stats.totalCount} transaction{stats.totalCount !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAmount}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingCount} tip{stats.pendingCount !== 1 ? 's' : ''} to distribute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidAmount}</div>
            <p className="text-xs text-muted-foreground">{stats.paidCount} tip{stats.paidCount !== 1 ? 's' : ''} distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Payment Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Payment: {paymentStatusFilter ? paymentStatusFilter : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Payment Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPaymentStatusFilter(null)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentStatusFilter('SUCCEEDED')}>
              Succeeded
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentStatusFilter('PENDING')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentStatusFilter('FAILED')}>
              Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Distribution Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Distribution: {distributionStatusFilter ? distributionStatusFilter : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Distribution Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDistributionStatusFilter(null)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDistributionStatusFilter('PENDING')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDistributionStatusFilter('PAID')}>
              Paid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Branch Filter */}
        {uniqueBranches.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Branch: {branchFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBranchFilter(null)}>
                All
              </DropdownMenuItem>
              {uniqueBranches.map((branch) => (
                <DropdownMenuItem
                  key={branch}
                  onClick={() => setBranchFilter(branch)}
                >
                  {branch}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Staff Filter */}
        {uniqueStaff.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Staff: {staffFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Staff</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStaffFilter(null)}>
                All
              </DropdownMenuItem>
              {uniqueStaff.map((staff) => (
                <DropdownMenuItem
                  key={staff}
                  onClick={() => setStaffFilter(staff)}
                >
                  {staff}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Search Input */}
        <Input
          placeholder="Search by note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-[200px]"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredTips.length} of {tips.length} tips
        </div>
      </div>

      {pendingTips.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTips.size} of {pendingTips.length} pending tips selected
          </div>
          <Button
            onClick={handleMarkAsPaid}
            disabled={selectedTips.size === 0 || loading}
            size="sm"
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Mark ${selectedTips.size || ''} as Paid`
            )}
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {pendingTips.length > 0 && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTips.size === pendingTips.length && pendingTips.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Branch</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Staff</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Payment</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Distribution</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {filteredTips.length === 0 ? (
              <tr>
                <td
                  colSpan={pendingTips.length > 0 ? 9 : 8}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No tips match the current filters
                </td>
              </tr>
            ) : (
              filteredTips.map((tip) => {
                const isPending = tip.distributionStatus === 'PENDING' && tip.paymentStatus === 'SUCCEEDED';
                return (
                <tr key={tip.id} className="border-b">
                  {pendingTips.length > 0 && (
                    <td className="px-4 py-3">
                      {isPending && (
                        <input
                          type="checkbox"
                          checked={selectedTips.has(tip.id)}
                          onChange={() => handleSelectTip(tip.id)}
                          className="rounded border-gray-300"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{tip.branchName}</td>
                  <td className="px-4 py-3 text-sm">{tip.staffName}</td>
                  <td className="px-4 py-3 text-sm font-medium">{tip.formattedAmount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tip.paymentStatus)}
                      <span className="text-sm capitalize">{tip.paymentStatus.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getDistributionBadge(tip.distributionStatus)}</td>
                  <td className="px-4 py-3">
                    {tip.customerRating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{tip.customerRating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {tip.customerNote || '-'}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}