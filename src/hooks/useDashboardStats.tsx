import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalBuildings: number;
  totalTenants: number;
  totalRooms: number;
  totalCapacity: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  todaysDue: number;
  overdueCount: number;
  monthlyRevenue: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch buildings count
      const { count: buildingsCount } = await supabase
        .from('buildings')
        .select('*', { count: 'exact', head: true });

      // Fetch active tenants count
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch rooms with capacity
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id, capacity');

      const totalRooms = rooms?.length ?? 0;
      const totalCapacity = rooms?.reduce((sum, room) => sum + room.capacity, 0) ?? 0;

      // Count occupied beds (active tenants)
      const occupiedBeds = tenantsCount ?? 0;
      const vacantBeds = totalCapacity - occupiedBeds;
      const occupancyRate = totalCapacity > 0 ? (occupiedBeds / totalCapacity) * 100 : 0;

      // Get today's due payments count
      const today = new Date().toISOString().split('T')[0];
      const { count: todaysDue } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('due_date', today)
        .eq('status', 'pending');

      // Get overdue payments count
      const { count: overdueCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .in('status', ['pending', 'overdue']);

      // Get current month's revenue
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const { data: paidPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .eq('status', 'paid');

      const monthlyRevenue = paidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

      return {
        totalBuildings: buildingsCount ?? 0,
        totalTenants: tenantsCount ?? 0,
        totalRooms,
        totalCapacity,
        occupiedBeds,
        vacantBeds,
        occupancyRate,
        todaysDue: todaysDue ?? 0,
        overdueCount: overdueCount ?? 0,
        monthlyRevenue,
      };
    },
  });
}
