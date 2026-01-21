import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Payment, PaymentWithTenant, PaymentTransaction } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function usePayments(status?: 'pending' | 'paid' | 'overdue' | 'partial' | 'partial_overdue') {
  return useQuery({
    queryKey: ['payments', status],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          tenant:tenants(
            *,
            room:rooms(
              *,
              building:buildings(*)
            )
          )
        `)
        .order('due_date', { ascending: true });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PaymentWithTenant[];
    },
  });
}

export function useTodaysDuePayments() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['payments', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          tenant:tenants(
            *,
            room:rooms(
              *,
              building:buildings(*)
            )
          )
        `)
        .eq('due_date', today)
        .in('status', ['pending', 'partial'])
        .order('created_at');
      
      if (error) throw error;
      return data as PaymentWithTenant[];
    },
  });
}

export function useOverduePayments() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['payments', 'overdue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          tenant:tenants(
            *,
            room:rooms(
              *,
              building:buildings(*)
            )
          )
        `)
        .lt('due_date', today)
        .in('status', ['pending', 'overdue', 'partial', 'partial_overdue'])
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as PaymentWithTenant[];
    },
  });
}

export function useTenantPayments(tenantId: string) {
  return useQuery({
    queryKey: ['payments', 'tenant', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!tenantId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'paid_date' | 'marked_by' | 'amount_paid'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({ ...payment, amount_paid: 0 })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Payment record created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating payment', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Get payment details
      const { data: payment } = await supabase
        .from('payments')
        .select('amount, amount_paid')
        .eq('id', id)
        .single();
      
      if (!payment) throw new Error('Payment not found');
      
      const remainingAmount = payment.amount - payment.amount_paid;
      
      // Add a transaction for the remaining amount
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          payment_id: id,
          amount: remainingAmount,
          payment_date: new Date().toISOString().split('T')[0],
          note: 'Marked as fully paid',
          created_by: userId,
        });
      
      if (transactionError) throw transactionError;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Payment marked as paid' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating payment', description: error.message, variant: 'destructive' });
    },
  });
}

// Add partial payment
export function useAddPaymentTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      amount, 
      paymentDate, 
      note, 
      userId 
    }: { 
      paymentId: string; 
      amount: number; 
      paymentDate: string;
      note?: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          payment_id: paymentId,
          amount,
          payment_date: paymentDate,
          note: note || null,
          created_by: userId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Payment recorded successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error recording payment', description: error.message, variant: 'destructive' });
    },
  });
}

// Get payment transactions for a specific payment
export function usePaymentTransactions(paymentId: string) {
  return useQuery({
    queryKey: ['payment_transactions', paymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as PaymentTransaction[];
    },
    enabled: !!paymentId,
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: ['payments', 'revenue'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('payments')
        .select('month, year, amount, status')
        .eq('year', currentYear)
        .eq('status', 'paid');
      
      if (error) throw error;
      
      // Group by month
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        revenue: 0,
      }));
      
      data?.forEach(payment => {
        monthlyData[payment.month - 1].revenue += Number(payment.amount);
      });
      
      return monthlyData;
    },
  });
}
