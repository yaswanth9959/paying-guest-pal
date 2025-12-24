import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, LogOut } from 'lucide-react';

export default function Settings() {
  const { user, role, signOut } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  role === 'owner' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Shield className="h-4 w-4 mr-1" />
                  {role === 'owner' ? 'Owner' : 'Staff'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions
            </CardTitle>
            <CardDescription>What you can do in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {role === 'owner' ? (
              <div className="space-y-2">
                <p className="font-medium text-success">As an Owner, you can:</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Add, edit, and delete buildings</li>
                  <li>Add, edit, and delete rooms</li>
                  <li>Add and remove tenants</li>
                  <li>Create and manage payment records</li>
                  <li>Mark payments as paid</li>
                  <li>Manage staff accounts</li>
                  <li>View all reports and analytics</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-primary">As Staff, you can:</p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>View all buildings, rooms, and tenants</li>
                  <li>Update tenant information</li>
                  <li>Mark payments as paid</li>
                  <li>Send WhatsApp reminders</li>
                  <li>View dashboard and reports</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Note: Only owners can add or delete buildings, rooms, and tenants.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Manage your current session</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
