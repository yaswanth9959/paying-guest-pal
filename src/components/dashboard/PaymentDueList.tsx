import { PaymentWithTenant } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, MessageCircle, AlertCircle } from 'lucide-react';
import { useMarkPaymentPaid } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName, generateWhatsAppLink } from '@/lib/helpers';
import { cn } from '@/lib/utils';

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

  const handleMarkPaid = (paymentId: string) => {
    if (user) {
      markPaid.mutate({ id: paymentId, userId: user.id });
    }
  };

  const handleWhatsAppReminder = (payment: PaymentWithTenant) => {
    if (!payment.tenant) return;
    
    const link = generateWhatsAppLink(
      payment.tenant.phone,
      payment.tenant.name,
      payment.amount,
      getMonthName(payment.month)
    );
    
    window.open(link, '_blank');
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
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {payment.tenant?.name || 'Unknown Tenant'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.tenant?.room?.building?.name} - Room {payment.tenant?.room?.room_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getMonthName(payment.month)} {payment.year}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={cn(
                    "font-bold text-lg",
                    variant === 'overdue' ? "text-destructive" : "text-warning"
                  )}>
                    {formatCurrency(payment.amount)}
                  </span>
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
                    title="Mark as Paid"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
