import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddPaymentTransaction } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { PaymentWithTenant, getPaymentBalance } from '@/types/database';
import { formatCurrency, getMonthName } from '@/lib/helpers';

interface AddPaymentDialogProps {
  payment: PaymentWithTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPaymentDialog({ payment, open, onOpenChange }: AddPaymentDialogProps) {
  const { user } = useAuth();
  const addTransaction = useAddPaymentTransaction();
  
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const balance = payment ? getPaymentBalance(payment) : 0;

  const handleSubmit = () => {
    if (!payment || !user || !amount) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    addTransaction.mutate({
      paymentId: payment.id,
      amount: parsedAmount,
      paymentDate,
      note: note.trim() || undefined,
      userId: user.id,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setAmount('');
        setNote('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
      }
    });
  };

  const handlePayFull = () => {
    if (balance > 0) {
      setAmount(balance.toString());
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Payment Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">{payment.tenant?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium">{getMonthName(payment.month)} {payment.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rent Amount</span>
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid So Far</span>
              <span className="font-medium text-success">{formatCurrency(payment.amount_paid)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground font-medium">Balance</span>
              <span className="font-bold text-destructive">{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-primary"
                onClick={handlePayFull}
              >
                Pay Full Balance
              </Button>
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={balance}
              min={1}
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note about this payment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || addTransaction.isPending}
          >
            {addTransaction.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
