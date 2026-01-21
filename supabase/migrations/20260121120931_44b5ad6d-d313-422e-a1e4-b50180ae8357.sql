-- Add amount_paid column to payments table for tracking partial payments
ALTER TABLE public.payments 
ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0;

-- Create payment_transactions table to track individual payment entries
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_transactions
CREATE POLICY "Authenticated users can view payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Owners can delete payment transactions" 
ON public.payment_transactions 
FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role));

-- Create function to update payment status based on amount_paid
CREATE OR REPLACE FUNCTION public.update_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid numeric;
  rent_amount numeric;
  payment_due_date date;
  new_status text;
BEGIN
  -- Get total amount paid for this payment
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payment_transactions
  WHERE payment_id = COALESCE(NEW.payment_id, OLD.payment_id);
  
  -- Get the rent amount and due date
  SELECT amount, due_date INTO rent_amount, payment_due_date
  FROM public.payments
  WHERE id = COALESCE(NEW.payment_id, OLD.payment_id);
  
  -- Determine status
  IF total_paid >= rent_amount THEN
    new_status := 'paid';
  ELSIF total_paid > 0 THEN
    IF payment_due_date < CURRENT_DATE THEN
      new_status := 'partial_overdue';
    ELSE
      new_status := 'partial';
    END IF;
  ELSE
    IF payment_due_date < CURRENT_DATE THEN
      new_status := 'overdue';
    ELSE
      new_status := 'pending';
    END IF;
  END IF;
  
  -- Update the payment record
  UPDATE public.payments
  SET 
    amount_paid = total_paid,
    status = new_status,
    paid_date = CASE WHEN total_paid >= rent_amount THEN CURRENT_DATE ELSE NULL END
  WHERE id = COALESCE(NEW.payment_id, OLD.payment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update payment status on transaction changes
CREATE TRIGGER update_payment_on_transaction
AFTER INSERT OR DELETE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_status();