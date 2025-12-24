export type AppRole = 'owner' | 'staff';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Building {
  id: string;
  name: string;
  address: string | null;
  total_rooms: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  building_id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  rent_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  occupation: string | null;
  room_id: string | null;
  monthly_rent: number;
  joining_date: string;
  leaving_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  month: number;
  year: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  marked_by: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface RoomWithBuilding extends Room {
  building?: Building;
}

export interface TenantWithRoom extends Tenant {
  room?: RoomWithBuilding;
}

export interface PaymentWithTenant extends Payment {
  tenant?: TenantWithRoom;
}
