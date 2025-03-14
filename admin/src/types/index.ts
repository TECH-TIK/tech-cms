// Interface pour un serveur
export interface Server {
  id?: number
  name: string
  hostname: string
  type: string
  ip: string
  username: string
  password?: string
  port: number
  secure: boolean
  apiToken?: string
  nameserver1?: string
  nameserver2?: string
  nameserver3?: string
  nameserver4?: string
  server_load?: number
}

// Interface pour un plan cPanel
export interface CpanelPlan {
  id: string
  name: string
}

// Interface pour une option de virtualisation
export interface VirtualizationType {
  id: string
  name: string
}

// Interface pour un template d'OS
export interface OsTemplate {
  id: string
  name: string
}

// Interface pour un stockage Proxmox
export interface ProxmoxStorage {
  id: string
  name: string
}

// Interface pour un template Proxmox
export interface ProxmoxTemplate {
  id: string
  name: string
}

// Interface pour une notification
export interface Notification {
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timeout?: number
}

// Interface pour un service
export interface Service {
  id?: number
  client_id: number
  product_id: number
  status: 'pending' | 'active' | 'suspended' | 'cancelled' | 'terminated' | 'fraud'
  domain?: string
  server_id?: number
  username?: string
  password?: string
  next_due_date?: string
  billing_cycle?: 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'biennially' | 'triennially'
  recurring_amount?: number
  setup_fee?: number
  renewal_price?: number
  cancellation_date?: string
  suspension_date?: string
  termination_date?: string
  notes?: string
  created_by?: number
  created_at?: string
  updated_at?: string
  // Champs joints
  client_name?: string
  client_email?: string
  product_name?: string
  server_name?: string
  configuration?: Record<string, string>
}

// Interface pour les statistiques des services
export interface ServiceStats {
  count_by_status: Record<string, number>
  recent_services: Service[]
  renewal_services: Service[]
} 