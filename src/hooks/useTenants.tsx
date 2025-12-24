import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantWithRoom } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useTenants(activeOnly = true) {
  return useQuery({
    queryKey: ['tenants', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('tenants')
        .select(`
          *,
          room:rooms(
            *,
            building:buildings(*)
          )
        `)
        .order('name');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TenantWithRoom[];
    },
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          room:rooms(
            *,
            building:buildings(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as TenantWithRoom;
    },
    enabled: !!id,
  });
}

export function useTenantsInRoom(roomId: string) {
  return useQuery({
    queryKey: ['tenants', 'room', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Tenant[];
    },
    enabled: !!roomId,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'leaving_date' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert({ ...tenant, is_active: true })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Tenant added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding tenant', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tenant> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Tenant updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating tenant', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          is_active: false, 
          leaving_date: new Date().toISOString().split('T')[0],
          room_id: null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Tenant marked as left' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating tenant', description: error.message, variant: 'destructive' });
    },
  });
}
