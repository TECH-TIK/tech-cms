/**
 * Types API pour le portail client TechCMS
 * 
 * Ces interfaces correspondent exactement au schéma de base de données
 * et sont utilisées pour typer les réponses des APIs backend.
 */

/**
 * Interface pour les factures (table invoices)
 */
export interface Invoice {
  id: number
  client_id: number
  product_id?: number
  number: string
  status: 'draft' | 'unpaid' | 'paid' | 'cancelled'
  date: string
  due_date: string
  amount: number
  notes?: string
  paid_at?: string
  last_reminder_sent?: string
  reminder_count: number
  reminder_type?: string
  created_at: string
  updated_at?: string
}

/**
 * Interface pour les services (table services)
 */
export interface Service {
  id: number
  client_id: number
  product_id: number
  status: 'pending' | 'active' | 'suspended' | 'cancelled' | 'terminated' | 'fraud'
  domain?: string
  server_id?: number
  username?: string
  password?: string
  next_due_date?: string
  billing_cycle: 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'biennially' | 'triennially'
  recurring_amount: number
  setup_fee: number
  renewal_price?: number
  cancellation_date?: string
  suspension_date?: string
  termination_date?: string
  notes?: string
  created_by?: number
  created_at: string
  updated_at?: string
  // Champs ajoutés par les jointures avec products
  name?: string
  type?: string
}

/**
 * Interface pour les produits (table products)
 */
export interface Product {
  id: number
  name: string
  product_type: string
  description?: string
  price: number
  setup_fee: number
  billing_cycle: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at?: string
}

/**
 * Interface pour les clients (table clients)
 */
export interface Client {
  id: number
  email: string
  firstname: string
  lastname: string
  company?: string
  phone?: string
  address?: string
  postal_code?: string
  city?: string
  country?: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at?: string
}

/**
 * Interface pour les tickets (table tickets)
 */
export interface Ticket {
  id: number
  client_id: number
  title: string
  subject?: string // Alias pour compatibilité
  message?: string
  status: 'open' | 'answered' | 'customer-reply' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department_id?: number
  assigned_to?: number
  created_at: string
  updated_at?: string
}

/**
 * Types pour les réponses API
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  message?: string
}

/**
 * Types pour les filtres et paramètres de requête
 */
export interface InvoiceFilters {
  status?: string
  period?: string
  search?: string
  page?: number
  per_page?: number
}

export interface ServiceFilters {
  status?: string
  type?: string
  search?: string
  page?: number
  per_page?: number
}

/**
 * Types pour les statistiques du dashboard
 */
export interface DashboardStats {
  services: {
    total: number
    active: number
    suspended: number
  }
  invoices: {
    total: number
    paid: number
    unpaid: number
    total_due: number
  }
  tickets: {
    total: number
    open: number
    in_progress: number
    resolved: number
  }
}

export interface DashboardOverview {
  stats: DashboardStats
  recent_services: Service[]
  recent_invoices: Invoice[]
  unpaid_invoices: Invoice[]
  recent_tickets: Ticket[]
  open_tickets: Ticket[]
}

/**
 * Types pour les clients
 */
export interface Client {
  id: number
  firstname: string
  lastname: string
  email: string
  company?: string
  phone?: string
  address?: string
  postal_code?: string
  city?: string
  country?: string
  status: 'active' | 'inactive' | 'suspended'
  last_login?: string
  created_at: string
  updated_at?: string
}

// Interface Ticket déjà définie plus haut, on l'étend ici
declare module './api' {
  interface Ticket {
    // Propriétés de jointure supplémentaires
    department_name?: string
    service_name?: string
    replies_count?: number
    last_reply_at?: string
  }
}

/**
 * Types pour les réponses de tickets
 */
export interface TicketReply {
  id: number
  ticket_id: number
  user_id: number
  user_type: 'admin' | 'client'
  message: string
  created_at: string

  // Propriétés de jointure
  user_name?: string
}

/**
 * Types pour les départements de tickets
 */
export interface TicketDepartment {
  id: number
  name: string
  description?: string
  email?: string
  active: boolean
  created_at: string
  updated_at?: string
}

/**
 * Types pour les filtres de tickets
 */
export interface TicketFilters {
  status?: string
  priority?: string
  department_id?: number
  search?: string
  page?: number
  per_page?: number
}

/**
 * Types pour les formulaires
 */
export interface ClientProfileForm {
  firstname: string
  lastname: string
  email: string
  company?: string
  phone?: string
  address?: string
  postal_code?: string
  city?: string
  country?: string
}

export interface PasswordChangeForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface TicketCreateForm {
  subject: string
  message: string
  department_id?: number
  service_id?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
}
