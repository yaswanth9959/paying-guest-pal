import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Room, RoomWithBuilding } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useRooms(buildingId?: string) {
  return useQuery({
    queryKey: ['rooms', buildingId],
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select('*, building:buildings(*)')
        .order('room_number');
      
      if (buildingId) {
        query = query.eq('building_id', buildingId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as RoomWithBuilding[];
    },
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', 'single', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, building:buildings(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as RoomWithBuilding;
    },
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert(room)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({ title: 'Room added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding room', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Room> & { id: string }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Room updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating room', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast({ title: 'Room deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting room', description: error.message, variant: 'destructive' });
    },
  });
}
