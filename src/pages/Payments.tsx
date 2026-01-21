import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePayments, useMarkPaymentPaid, useCreatePayment, useTodaysDuePayments, useOverduePayments } from '@/hooks/usePayments';
import { useTenants } from '@/hooks/useTenants';
import { useAuth } from '@/hooks/useAuth';
import { PaymentWithTenant, getPaymentBalance, isPaymentPartial } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Check, MessageCircle, CreditCard, AlertCircle, History } from 'lucide-react';
import { formatCurrency, formatDate, getMonthName, generateWhatsAppLink } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { PaymentHistoryDialog } from '@/components/payments/PaymentHistoryDialog';

export default function Payments() {
  const { user, isOwner } = useAuth();
  const { data: allPayments, isLoading } = usePayments();
  const { data: todaysPayments } = useTodaysDuePayments();
  const { data: overduePayments } = useOverduePayments();
  const { data: tenants } = useTenants();
  const markPaid = useMarkPaymentPaid();
  const createPayment = useCreatePayment();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    tenant_id: '',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    due_date: '',
  });

  // Dialogs for partial payments
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

  const handleCreatePayment = () => {
    const tenant = tenants?.find(t => t.id === formData.tenant_id);
    if (!tenant || !formData.due_date) return;

    createPayment.mutate({
      tenant_id: formData.tenant_id,
      amount: tenant.monthly_rent,
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      due_date: formData.due_date,
      status: 'pending',
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormData({
          tenant_id: '',
          month: (new Date().getMonth() + 1).toString(),
          year: new Date().getFullYear().toString(),
          due_date: '',
        });
      }
    });
  };

  const handleAddPayment = (payment: PaymentWithTenant) => {
    setSelectedPayment(payment);
    setAddPaymentOpen(true);
  };

  const handleViewHistory = (payment: PaymentWithTenant) => {
    setSelectedPayment(payment);
    setHistoryOpen(true);
  };

  const getStatusBadge = (payment: PaymentWithTenant) => {
    const status = payment.status;
    const balance = getPaymentBalance(payment);
    
    if (status === 'paid' || balance <= 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">Paid</span>;
    }
    if (status === 'partial' || status === 'partial_overdue') {
      const badgeClass = status === 'partial_overdue' 
        ? "bg-destructive/10 text-destructive"
        : "bg-warning/10 text-warning";
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>Partial</span>;
    }
    if (status === 'overdue') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">Overdue</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">Pending</span>;
  };

  const paidPayments = allPayments?.filter(p => p.status === 'paid') ?? [];
  const pendingPayments = allPayments?.filter(p => p.status !== 'paid') ?? [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Track and manage rent payments</p>
          </div>
          {isOwner && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Payment Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Tenant</Label>
                    <Select
                      value={formData.tenant_id}
                      onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants?.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} - {formatCurrency(tenant.monthly_rent)}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Month</Label>
                      <Select
                        value={formData.month}
                        onValueChange={(value) => setFormData({ ...formData, month: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {getMonthName(i + 1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleCreatePayment}
                    disabled={!formData.tenant_id || !formData.due_date || createPayment.isPending}
                  >
                    {createPayment.isPending ? 'Creating...' : 'Create Payment'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <CreditCard className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{todaysPayments?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overduePayments?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
              <Check className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {paidPayments.filter(p => 
                  p.month === new Date().getMonth() + 1 && 
                  p.year === new Date().getFullYear()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid ({paidPayments.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({allPayments?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {['pending', 'paid', 'all'].map((tab) => {
            const payments = tab === 'pending' ? pendingPayments : 
                            tab === 'paid' ? paidPayments : 
                            allPayments ?? [];
            
            return (
              <TabsContent key={tab} value={tab}>
                {payments.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No payments</h3>
                      <p className="text-muted-foreground">
                        {tab === 'pending' ? 'All caught up!' : 'No payment records yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Rent</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => {
                            const balance = getPaymentBalance(payment);
                            const isPartial = isPaymentPartial(payment);
                            
                            return (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                  {payment.tenant?.name || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  {payment.tenant?.room ? (
                                    <span>
                                      {payment.tenant.room.building?.name} - Room {payment.tenant.room.room_number}
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  {getMonthName(payment.month)} {payment.year}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(payment.amount)}
                                </TableCell>
                                <TableCell className="text-success font-medium">
                                  {formatCurrency(payment.amount_paid)}
                                </TableCell>
                                <TableCell className={cn(
                                  "font-medium",
                                  balance > 0 ? "text-destructive" : "text-success"
                                )}>
                                  {formatCurrency(balance)}
                                </TableCell>
                                <TableCell>
                                  {formatDate(payment.due_date)}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(payment)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    {payment.status !== 'paid' && balance > 0 && (
                                      <>
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
                                      </>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-muted-foreground hover:text-foreground"
                                      onClick={() => handleViewHistory(payment)}
                                      title="View Payment History"
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

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
    </DashboardLayout>
  );
}
