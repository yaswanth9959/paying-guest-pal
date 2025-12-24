import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTenants, useCreateTenant, useUpdateTenant, useDeactivateTenant } from '@/hooks/useTenants';
import { useRooms } from '@/hooks/useRooms';
import { useBuildings } from '@/hooks/useBuildings';
import { useAuth } from '@/hooks/useAuth';
import { Tenant, TenantWithRoom } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Edit, UserMinus, Search, Phone, Calendar, Building2, Home, MessageCircle } from 'lucide-react';
import { formatCurrency, formatDate, generateWhatsAppLink, getMonthName } from '@/lib/helpers';
import { cn } from '@/lib/utils';

interface TenantFormData {
  name: string;
  phone: string;
  occupation: string;
  room_id: string;
  monthly_rent: string;
  joining_date: string;
}

const initialFormData: TenantFormData = {
  name: '',
  phone: '',
  occupation: '',
  room_id: '',
  monthly_rent: '',
  joining_date: new Date().toISOString().split('T')[0],
};

export default function Tenants() {
  const { isOwner } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const { data: tenants, isLoading } = useTenants(!showHistory);
  const { data: rooms } = useRooms();
  const { data: buildings } = useBuildings();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deactivateTenant = useDeactivateTenant();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<TenantWithRoom | null>(null);
  const [formData, setFormData] = useState<TenantFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');

  // Get rooms with availability info
  const getRoomOccupancy = (roomId: string) => {
    const room = rooms?.find(r => r.id === roomId);
    if (!room) return { occupied: 0, capacity: 0 };
    const occupied = tenants?.filter(t => t.room_id === roomId && t.is_active).length ?? 0;
    return { occupied, capacity: room.capacity };
  };

  const getAvailableRooms = () => {
    return rooms?.filter(room => {
      const { occupied, capacity } = getRoomOccupancy(room.id);
      return occupied < capacity;
    }) ?? [];
  };

  const filteredTenants = tenants?.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.phone.includes(searchQuery);
    const matchesBuilding = 
      selectedBuilding === 'all' || 
      tenant.room?.building_id === selectedBuilding;
    return matchesSearch && matchesBuilding;
  }) ?? [];

  const handleAdd = () => {
    if (formData.name && formData.phone && formData.room_id && formData.monthly_rent) {
      createTenant.mutate({
        name: formData.name,
        phone: formData.phone,
        occupation: formData.occupation || null,
        room_id: formData.room_id,
        monthly_rent: parseFloat(formData.monthly_rent),
        joining_date: formData.joining_date,
      }, {
        onSuccess: () => {
          setIsAddOpen(false);
          setFormData(initialFormData);
        }
      });
    }
  };

  const handleEdit = () => {
    if (editTenant && formData.name && formData.phone) {
      updateTenant.mutate({
        id: editTenant.id,
        name: formData.name,
        phone: formData.phone,
        occupation: formData.occupation || null,
        room_id: formData.room_id || null,
        monthly_rent: parseFloat(formData.monthly_rent),
      }, {
        onSuccess: () => {
          setEditTenant(null);
          setFormData(initialFormData);
        }
      });
    }
  };

  const handleDeactivate = (id: string) => {
    deactivateTenant.mutate(id);
  };

  const openEditDialog = (tenant: TenantWithRoom) => {
    setEditTenant(tenant);
    setFormData({
      name: tenant.name,
      phone: tenant.phone,
      occupation: tenant.occupation || '',
      room_id: tenant.room_id || '',
      monthly_rent: tenant.monthly_rent.toString(),
      joining_date: tenant.joining_date,
    });
  };

  const sendWhatsAppMessage = (tenant: TenantWithRoom) => {
    const currentMonth = getMonthName(new Date().getMonth() + 1);
    const link = generateWhatsAppLink(
      tenant.phone,
      tenant.name,
      tenant.monthly_rent,
      currentMonth
    );
    window.open(link, '_blank');
  };

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
            <h1 className="text-3xl font-bold">Tenants</h1>
            <p className="text-muted-foreground">
              {showHistory ? 'All tenants including past' : 'Active tenants'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showHistory ? 'default' : 'outline'}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Show Active Only' : 'Show History'}
            </Button>
            {isOwner && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tenant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Tenant</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Tenant name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="10-digit phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        placeholder="e.g., Student, Employee"
                      />
                    </div>
                    <div>
                      <Label htmlFor="room">Room *</Label>
                      <Select
                        value={formData.room_id}
                        onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRooms().map((room) => {
                            const { occupied, capacity } = getRoomOccupancy(room.id);
                            return (
                              <SelectItem key={room.id} value={room.id}>
                                {room.building?.name} - Room {room.room_number} ({occupied}/{capacity})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rent">Monthly Rent (₹) *</Label>
                      <Input
                        id="rent"
                        type="number"
                        value={formData.monthly_rent}
                        onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                        placeholder="e.g., 5000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="joining">Joining Date *</Label>
                      <Input
                        id="joining"
                        type="date"
                        value={formData.joining_date}
                        onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleAdd} 
                      disabled={!formData.name || !formData.phone || !formData.room_id || !formData.monthly_rent || createTenant.isPending}
                    >
                      {createTenant.isPending ? 'Adding...' : 'Add Tenant'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings?.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tenants Table */}
        {filteredTenants.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tenants found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedBuilding !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first tenant to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          {tenant.occupation && (
                            <p className="text-sm text-muted-foreground">{tenant.occupation}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {tenant.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.room ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span>{tenant.room.building?.name}</span>
                            <Home className="h-3 w-3 text-muted-foreground ml-2" />
                            <span>{tenant.room.room_number}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(tenant.monthly_rent)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(tenant.joining_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          tenant.is_active 
                            ? "bg-success/10 text-success" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {tenant.is_active ? 'Active' : 'Left'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => sendWhatsAppMessage(tenant)}
                            title="Send WhatsApp Message"
                          >
                            <MessageCircle className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(tenant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isOwner && tenant.is_active && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-destructive">
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark Tenant as Left?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will mark {tenant.name} as no longer active. The tenant history will be preserved.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeactivate(tenant.id)}>
                                    Mark as Left
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editTenant} onOpenChange={(open) => !open && setEditTenant(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-occupation">Occupation</Label>
                <Input
                  id="edit-occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-rent">Monthly Rent (₹)</Label>
                <Input
                  id="edit-rent"
                  type="number"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTenant(null)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={!formData.name || !formData.phone || updateTenant.isPending}>
                {updateTenant.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
