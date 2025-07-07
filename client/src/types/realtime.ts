/**
 * Types pour les événements temps réel côté client TechCMS
 */

export interface RealtimeAuthor {
  id: number
  name: string
  type: 'admin' | 'client'
}

export interface RealtimeEvent {
  action: 'reply' | 'status_change' | 'update' | 'assignment'
  ticket: any
  timestamp: string
  author: RealtimeAuthor
  data?: any
  reply?: {
    id: string | number
    message: string
    created_at: string
    author_name: string
    user_id: string | number
    user_type: string
  }
}

// Types pour les événements dashboard temps réel
export interface DashboardRealtimeEvent {
  action: 'service_update' | 'invoice_update' | 'ticket_update' | 'stats_update' | 'notification' |
          'service_delete' | 'service_status_changed' | 'service_create' | 'invoice_create' | 'ticket_create' |
          'delete' | 'deleted' | 'status_changed' | 'update' | 'updated' | 'create' | 'created'
  entity_type: 'service' | 'invoice' | 'ticket' | 'stats' | 'notification'
  entity_id?: string | number
  client_id: number
  data: {
    service?: Service
    invoice?: Invoice
    ticket?: Ticket
    stats?: DashboardStats
    notification?: DashboardNotification
    action?: string  // Action spécifique pour les données
  }
  timestamp: string
  author?: {
    id: number
    name: string
    type: 'system' | 'admin'
  }
}

// Types pour les services
export interface Service {
  id: number
  client_id: number
  name: string
  type: string
  status: 'active' | 'suspended' | 'terminated' | 'cancelled'
  price: number
  billing_cycle: string
  next_due_date: string
  created_at: string
  updated_at: string
}

// Types pour les factures
export interface Invoice {
  id: number
  client_id: number
  number: string
  amount: number
  status: 'paid' | 'unpaid' | 'cancelled' | 'refunded'
  due_date: string
  created_at: string
  updated_at: string
}

// Types pour les tickets
export interface Ticket {
  id: number
  client_id: number
  title: string
  status: 'open' | 'answered' | 'customer-reply' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
}

// Types pour les statistiques dashboard
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

// Types pour les notifications
export interface DashboardNotification {
  id: string
  type: 'service' | 'invoice' | 'ticket' | 'system'
  title: string
  message: string
  icon: string
  read: boolean
  created_at: string
  action_url?: string
  data?: any
}

export interface TicketReplyEvent extends RealtimeEvent {
  action: 'reply'
  data: {
    id: number
    message: string
    created_at: string
    author_name: string
    is_staff: boolean
  }
}

export interface TicketStatusChangeEvent extends RealtimeEvent {
  action: 'status_change'
  data: {
    oldStatus: string
    newStatus: string
  }
}

export interface TicketUpdateEvent extends RealtimeEvent {
  action: 'update'
  data: {
    changes: Record<string, any>
  }
}

export interface TicketAssignmentEvent extends RealtimeEvent {
  action: 'assignment'
  data: {
    oldAssignee?: {
      id: number
      name: string
    }
    newAssignee?: {
      id: number
      name: string
    }
  }
}

export interface RealtimeConnectionState {
  initialized: boolean
  connected: boolean
  error: Error | null
  reconnectAttempts: number
  maxReconnectAttempts: number
}

export interface AblyChannelConfig {
  domain: string
  channelType: 'client' | 'ticket' | 'private-client'
  identifier?: string | number
}

export interface RealtimeSubscription {
  channel: string
  event: string
  callback: (message: any) => void
  unsubscribe: () => void
}

export type RealtimeEventType = 'ticket-reply' | 'ticket-status-change' | 'ticket-update' | 'ticket-assignment'

export type RealtimeChannelType = 
  | `${string}:private-client`
  | `${string}:private-client-${number}`
  | `${string}:ticket-${number}`
