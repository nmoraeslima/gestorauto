// ============================================================================
// PASSO 2: DEFINIÇÃO DE TIPOS TYPESCRIPT
// Types que espelham o banco de dados criado
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================
export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  PREMIUM = 'premium'
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user'
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum WorkOrderStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

// ============================================================================
// DATABASE TABLES TYPES
// ============================================================================

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;

  // Subscription
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  trial_ends_at?: string;
  subscription_ends_at?: string;

  // Limits
  max_users: number;
  max_customers: number;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Profile {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
  customer_type: CustomerType;
  vip: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  customer_id: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  photos: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  quantity: number;
  unit: string;
  min_stock: number;
  cost_price: number;
  sale_price: number;
  price?: number; // Alias for sale_price for frontend compatibility
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  company_id: string;
  customer_id: string;
  vehicle_id?: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface EntryChecklist {
  fuel_level?: string;
  mileage?: number;
  scratches: string[];
  personal_items: string[];
  notes: string;
}

export interface WorkOrder {
  id: string;
  company_id: string;
  customer_id: string;
  vehicle_id: string;
  appointment_id?: string;
  order_number: string;
  status: WorkOrderStatus;
  entry_date: string;
  expected_completion_date?: string;
  entry_checklist?: EntryChecklist;
  fuel_level?: number;
  odometer?: number;
  damage_notes?: string;
  customer_belongings?: string;
  internal_notes?: string;
  customer_notes?: string;
  started_at?: string;
  completed_at?: string;
  subtotal: number;
  discount: number;
  discount_type?: 'percentage' | 'fixed';
  total: number;
  total_amount?: number; // Alias for total
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderService {
  id: string;
  company_id: string;
  work_order_id: string;
  service_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface WorkOrderProduct {
  id: string;
  company_id: string;
  work_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit?: string;
  unit_cost?: number;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  company_id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  due_date: string;
  paid_at?: string;
  work_order_id?: string;
  customer_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXTENDED TYPES (com relacionamentos)
// ============================================================================

export interface CustomerWithVehicles extends Customer {
  vehicles?: Vehicle[];
}

export interface VehicleWithCustomer extends Vehicle {
  customer?: Customer;
}

export interface WorkOrderWithDetails extends WorkOrder {
  customer?: Customer;
  vehicle?: Vehicle;
  services?: WorkOrderService[];
  products?: WorkOrderProduct[];
  assigned_user?: Profile;
}

export interface AppointmentWithDetails extends Appointment {
  customer?: Customer;
  vehicle?: Vehicle;
  assigned_user?: Profile;
}

// ============================================================================
// FORM TYPES (para criação/edição)
// ============================================================================

export interface CompanyFormData {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone: string;
  cpf?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
  customer_type: CustomerType;
  vip: boolean;
}

export interface VehicleFormData {
  customer_id: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  notes?: string;
}

export interface ServiceFormData {
  name: string;
  description?: string;
  category?: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  quantity: number;
  unit: string;
  min_stock: number;
  cost_price: number;
  sale_price: number;
  is_active: boolean;
}

export interface WorkOrderFormData {
  customer_id: string;
  vehicle_id: string;
  entry_checklist: EntryChecklist;
  notes?: string;
  assigned_to?: string;
  services: {
    service_id: string;
    quantity: number;
  }[];
  products: {
    product_id: string;
    quantity: number;
  }[];
}

export interface FinancialTransactionFormData {
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  due_date: string;
  customer_id?: string;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  company_slug: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
  company?: Company;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface SubscriptionInfo {
  company_id: string;
  subscription_status: SubscriptionStatus;
  is_active: boolean;
  days_remaining: number;
}

export interface PlanLimits {
  max_users: number;
  max_customers: number;
  has_advanced_reports: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  [SubscriptionPlan.BASIC]: {
    max_users: 2,
    max_customers: 50,
    has_advanced_reports: false
  },
  [SubscriptionPlan.INTERMEDIATE]: {
    max_users: 5,
    max_customers: 200,
    has_advanced_reports: false
  },
  [SubscriptionPlan.PREMIUM]: {
    max_users: 999999,
    max_customers: 999999,
    has_advanced_reports: true
  }
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  total_customers: number;
  total_work_orders: number;
  work_orders_in_progress: number;
  monthly_revenue: number;
  pending_payments: number;
  low_stock_products: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}
