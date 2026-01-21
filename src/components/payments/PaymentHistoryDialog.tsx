import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePaymentTransactions } from '@/hooks/usePayments';
import { PaymentWithTenant, getPaymentBalance } from '@/types/database';
import { formatCurrency, formatDate, getMonthName } from '@/lib/helpers';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentHistoryDialogProps {
  payment: PaymentWithTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentHistoryDialog({ payment, open, onOpenChange }: PaymentHistoryDialogProps) {
  const { data: transactions, isLoading } = usePaymentTransactions(payment?.id ?? '');

  if (!payment) return null;

  const balance = getPaymentBalance(payment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Payment Summary */}
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
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-medium text-success">{formatCurrency(payment.amount_paid)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground font-medium">Balance</span>
              <span className={`font-bold ${balance > 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          {/* Transaction List */}
          <div>
            <h4 className="font-medium mb-3">Payment Transactions</h4>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-success">
                        +{formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.payment_date)}
                      </div>
                      {transaction.note && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {transaction.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No payments recorded yet
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
