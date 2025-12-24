import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { PaymentDueList } from '@/components/dashboard/PaymentDueList';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTodaysDuePayments, useOverduePayments } from '@/hooks/usePayments';
import { Building2, Users, Home, TrendingUp, AlertCircle, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todaysPayments, isLoading: todaysLoading } = useTodaysDuePayments();
  const { data: overduePayments, isLoading: overdueLoading } = useOverduePayments();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your PG business</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Buildings"
            value={statsLoading ? '...' : stats?.totalBuildings ?? 0}
            icon={<Building2 className="h-6 w-6" />}
          />
          <StatCard
            title="Total Tenants"
            value={statsLoading ? '...' : stats?.totalTenants ?? 0}
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Occupancy Rate"
            value={statsLoading ? '...' : `${Math.round(stats?.occupancyRate ?? 0)}%`}
            icon={<Home className="h-6 w-6" />}
            description={`${stats?.occupiedBeds ?? 0}/${stats?.totalCapacity ?? 0} beds occupied`}
            variant={
              (stats?.occupancyRate ?? 0) >= 80
                ? 'success'
                : (stats?.occupancyRate ?? 0) >= 50
                ? 'warning'
                : 'destructive'
            }
          />
          <StatCard
            title="This Month's Revenue"
            value={statsLoading ? '...' : formatCurrency(stats?.monthlyRevenue ?? 0)}
            icon={<IndianRupee className="h-6 w-6" />}
            variant="success"
          />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Due Today"
            value={statsLoading ? '...' : stats?.todaysDue ?? 0}
            icon={<TrendingUp className="h-6 w-6" />}
            description="Payments expected today"
            variant="warning"
          />
          <StatCard
            title="Overdue Payments"
            value={statsLoading ? '...' : stats?.overdueCount ?? 0}
            icon={<AlertCircle className="h-6 w-6" />}
            description="Payments past due date"
            variant={stats?.overdueCount && stats.overdueCount > 0 ? 'destructive' : 'default'}
          />
        </div>

        {/* Payment Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentDueList
            title="Due Today"
            payments={todaysPayments ?? []}
            isLoading={todaysLoading}
            variant="today"
            emptyMessage="No payments due today"
          />
          <PaymentDueList
            title="Overdue Payments"
            payments={overduePayments ?? []}
            isLoading={overdueLoading}
            variant="overdue"
            emptyMessage="No overdue payments"
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart />
      </div>
    </DashboardLayout>
  );
}
