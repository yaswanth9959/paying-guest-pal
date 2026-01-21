import { useState } from 'react';
import { PaymentWithTenant, getPaymentBalance, isPaymentPartial } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, MessageCircle, AlertCircle, Plus, History } from 'lucide-react';
import { useMarkPaymentPaid } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName, generateWhatsAppLink } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { PaymentHistoryDialog } from '@/components/payments/PaymentHistoryDialog';

interface PaymentDueListProps {
  title: string;
  payments: PaymentWithTenant[];
  isLoading?: boolean;
  variant?: 'today' | 'overdue';
  emptyMessage?: string;
}

export function PaymentDueList({
  title,
  payments,
  isLoading,
  variant = 'today',
  emptyMessage = 'No payments due',
}: PaymentDueListProps) {
  const { user } = useAuth();
  const markPaid = useMarkPaymentPaid();
  
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithTenant | null>(null);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleMarkPaid = (paymentId: string) => {
    if (user) {
      markPaid.mutate({ id: paymentId, userId: user.id });
    }
  };

  const handleWhatsAppReminder = (payment: PaymentWithTenant) => {
    if (!payment.tenant) return;
    
    const balance = getPaymentBalance(payment);
    const link = generateWhatsAppLink(
      payment.tenant.phone,
      payment.tenant.name,
      balance,
      getMonthName(payment.month)
    );
    
    window.open(link, '_blank');
  };

  const handleAddPayment = (payment: PaymentWithTenant) => {
    setSelectedPayment(payment);
    setAddPaymentOpen(true);
  };

  const handleViewHistory = (payment: PaymentWithTenant) => {
    setSelectedPayment(payment);
    setHistoryOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      variant === 'overdue' && "border-destructive/50"
    )}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {variant === 'overdue' && (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
          {title}
        </CardTitle>
        <span className={cn(
          "text-sm font-medium px-2 py-1 rounded-full",
          variant === 'today' 
            ? "bg-warning/10 text-warning" 
            : "bg-destructive/10 text-destructive"
        )}>
          {payments.length} {payments.length === 1 ? 'payment' : 'payments'}
        </span>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const balance = getPaymentBalance(payment);
              const isPartial = isPaymentPartial(payment);
              
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {payment.tenant?.name || 'Unknown Tenant'}
                      </p>
                      {isPartial && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning">
                          Partial
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {payment.tenant?.room?.building?.name} - Room {payment.tenant?.room?.room_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getMonthName(payment.month)} {payment.year}
                    </p>
                    {isPartial && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid: {formatCurrency(payment.amount_paid)} / {formatCurrency(payment.amount)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right mr-2">
                      <span className={cn(
                        "font-bold text-lg block",
                        variant === 'overdue' ? "text-destructive" : "text-warning"
                      )}>
                        {formatCurrency(balance)}
                      </span>
                      {isPartial && (
                        <span className="text-xs text-muted-foreground">balance</span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleAddPayment(payment)}
                      title="Add Payment"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleViewHistory(payment)}
                      title="View Payment History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-success hover:text-success hover:bg-success/10"
                      onClick={() => handleWhatsAppReminder(payment)}
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-success hover:text-success hover:bg-success/10"
                      onClick={() => handleMarkPaid(payment.id)}
                      disabled={markPaid.isPending}
                      title="Mark as Fully Paid"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <AddPaymentDialog 
        payment={selectedPayment}
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
      />
      <PaymentHistoryDialog
        payment={selectedPayment}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </Card>
  );
}
