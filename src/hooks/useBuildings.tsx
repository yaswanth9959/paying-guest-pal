import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Building[];
    },
  });
}

export function useBuilding(id: string) {
  return useQuery({
    queryKey: ['buildings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Building;
    },
    enabled: !!id,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (building: Omit<Building, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('buildings')
        .insert(building)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({ title: 'Building added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding building', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Building> & { id: string }) => {
      const { data, error } = await supabase
        .from('buildings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({ title: 'Building updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating building', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({ title: 'Building deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting building', description: error.message, variant: 'destructive' });
    },
  });
}
