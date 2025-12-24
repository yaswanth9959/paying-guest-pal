import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useBuildings, useCreateBuilding, useUpdateBuilding, useDeleteBuilding } from '@/hooks/useBuildings';
import { useRooms } from '@/hooks/useRooms';
import { useTenants } from '@/hooks/useTenants';
import { useAuth } from '@/hooks/useAuth';
import { Building } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Home, Users, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Buildings() {
  const { isOwner, user } = useAuth();
  const { data: buildings, isLoading } = useBuildings();
  const { data: allRooms } = useRooms();
  const { data: allTenants } = useTenants();
  const createBuilding = useCreateBuilding();
  const updateBuilding = useUpdateBuilding();
  const deleteBuilding = useDeleteBuilding();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

  const getBuildingStats = (buildingId: string) => {
    const rooms = allRooms?.filter(r => r.building_id === buildingId) ?? [];
    const totalRooms = rooms.length;
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = allTenants?.filter(
      t => t.is_active && rooms.some(r => r.id === t.room_id)
    ).length ?? 0;
    const vacantBeds = totalCapacity - occupiedBeds;

    return { totalRooms, totalCapacity, occupiedBeds, vacantBeds };
  };

  const handleAdd = () => {
    if (formData.name) {
      createBuilding.mutate({
        name: formData.name,
        address: formData.address || null,
        total_rooms: 0,
        created_by: user?.id || null,
      }, {
        onSuccess: () => {
          setIsAddOpen(false);
          setFormData({ name: '', address: '' });
        }
      });
    }
  };

  const handleEdit = () => {
    if (editBuilding && formData.name) {
      updateBuilding.mutate({
        id: editBuilding.id,
        name: formData.name,
        address: formData.address || null,
      }, {
        onSuccess: () => {
          setEditBuilding(null);
          setFormData({ name: '', address: '' });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteBuilding.mutate(id);
  };

  const openEditDialog = (building: Building) => {
    setEditBuilding(building);
    setFormData({ name: building.name, address: building.address || '' });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Buildings</h1>
            <p className="text-muted-foreground">Manage your PG properties</p>
          </div>
          {isOwner && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Building
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Building</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Building Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sunrise PG"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g., 123 Main Street"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={!formData.name || createBuilding.isPending}>
                    {createBuilding.isPending ? 'Adding...' : 'Add Building'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Buildings Grid */}
        {buildings?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No buildings yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first PG building to get started
              </p>
              {isOwner && (
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Building
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings?.map((building) => {
              const stats = getBuildingStats(building.id);
              const occupancyRate = stats.totalCapacity > 0 
                ? (stats.occupiedBeds / stats.totalCapacity) * 100 
                : 0;

              return (
                <Card key={building.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{building.name}</CardTitle>
                      {building.address && (
                        <p className="text-sm text-muted-foreground mt-1">{building.address}</p>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(building)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Building?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {building.name} and all its rooms. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(building.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{stats.totalRooms} Rooms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{stats.occupiedBeds}/{stats.totalCapacity} Beds</span>
                      </div>
                    </div>
                    
                    {/* Occupancy Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Occupancy</span>
                        <span className={cn(
                          "font-medium",
                          occupancyRate >= 80 ? "text-success" :
                          occupancyRate >= 50 ? "text-warning" : "text-destructive"
                        )}>
                          {Math.round(occupancyRate)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            occupancyRate >= 80 ? "bg-success" :
                            occupancyRate >= 50 ? "bg-warning" : "bg-destructive"
                          )}
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        stats.vacantBeds > 0 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {stats.vacantBeds} Vacant
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editBuilding} onOpenChange={(open) => !open && setEditBuilding(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Building</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Building Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditBuilding(null)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={!formData.name || updateBuilding.isPending}>
                {updateBuilding.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
