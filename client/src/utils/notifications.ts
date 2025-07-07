/**
 * Utilitaires pour la gestion des notifications dashboard
 */

import type { DashboardNotification } from '@/types/realtime'

/**
 * Crée une notification pour un nouveau service
 */
export function createServiceNotification(
  serviceData: any,
  action: 'created' | 'activated' | 'suspended' | 'renewed' | 'terminated'
): DashboardNotification {
  const actionMessages = {
    created: 'Nouveau service créé',
    activated: 'Service activé',
    suspended: 'Service suspendu',
    renewed: 'Service renouvelé',
    terminated: 'Service terminé'
  }

  const actionIcons = {
    created: 'fas fa-plus-circle',
    activated: 'fas fa-play-circle',
    suspended: 'fas fa-pause-circle',
    renewed: 'fas fa-refresh',
    terminated: 'fas fa-stop-circle'
  }

  return {
    id: `service-${serviceData.id}-${action}-${Date.now()}`,
    type: 'service',
    title: actionMessages[action],
    message: `${serviceData.name || 'Service'} - ${serviceData.domain || ''}`,
    icon: actionIcons[action],
    read: false,
    created_at: new Date().toISOString(),
    action_url: `/services/${serviceData.id}`,
    data: { service: serviceData, action }
  }
}

/**
 * Crée une notification pour une facture
 */
export function createInvoiceNotification(
  invoiceData: any,
  action: 'created' | 'paid' | 'overdue' | 'cancelled'
): DashboardNotification {
  const actionMessages = {
    created: 'Nouvelle facture générée',
    paid: 'Facture payée',
    overdue: 'Facture en retard',
    cancelled: 'Facture annulée'
  }

  const actionIcons = {
    created: 'fas fa-file-invoice',
    paid: 'fas fa-check-circle',
    overdue: 'fas fa-exclamation-triangle',
    cancelled: 'fas fa-times-circle'
  }

  const amount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(invoiceData.amount || 0)

  return {
    id: `invoice-${invoiceData.id}-${action}-${Date.now()}`,
    type: 'invoice',
    title: actionMessages[action],
    message: `Facture #${invoiceData.number || invoiceData.id} - ${amount}`,
    icon: actionIcons[action],
    read: false,
    created_at: new Date().toISOString(),
    action_url: `/invoices/${invoiceData.id}`,
    data: { invoice: invoiceData, action }
  }
}

/**
 * Crée une notification pour un ticket
 */
export function createTicketNotification(
  ticketData: any,
  action: 'created' | 'replied' | 'status_changed' | 'closed'
): DashboardNotification {
  const actionMessages = {
    created: 'Nouveau ticket créé',
    replied: 'Nouvelle réponse reçue',
    status_changed: 'Statut du ticket modifié',
    closed: 'Ticket fermé'
  }

  const actionIcons = {
    created: 'fas fa-ticket-alt',
    replied: 'fas fa-reply',
    status_changed: 'fas fa-edit',
    closed: 'fas fa-check-circle'
  }

  return {
    id: `ticket-${ticketData.id}-${action}-${Date.now()}`,
    type: 'ticket',
    title: actionMessages[action],
    message: `Ticket #${ticketData.id} - ${ticketData.title || ticketData.subject}`,
    icon: actionIcons[action],
    read: false,
    created_at: new Date().toISOString(),
    action_url: `/support/ticket/${ticketData.id}`,
    data: { ticket: ticketData, action }
  }
}

/**
 * Crée une notification système
 */
export function createSystemNotification(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  actionUrl?: string
): DashboardNotification {
  const typeIcons = {
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle',
    error: 'fas fa-times-circle',
    success: 'fas fa-check-circle'
  }

  return {
    id: `system-${type}-${Date.now()}`,
    type: 'system',
    title,
    message,
    icon: typeIcons[type],
    read: false,
    created_at: new Date().toISOString(),
    action_url: actionUrl,
    data: { type, level: type }
  }
}

/**
 * Filtre les notifications par type
 */
export function filterNotificationsByType(
  notifications: DashboardNotification[],
  type: string
): DashboardNotification[] {
  return notifications.filter(notification => notification.type === type)
}

/**
 * Filtre les notifications non lues
 */
export function getUnreadNotifications(
  notifications: DashboardNotification[]
): DashboardNotification[] {
  return notifications.filter(notification => !notification.read)
}

/**
 * Trie les notifications par date (plus récent en premier)
 */
export function sortNotificationsByDate(
  notifications: DashboardNotification[]
): DashboardNotification[] {
  return [...notifications].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

/**
 * Groupe les notifications par type
 */
export function groupNotificationsByType(
  notifications: DashboardNotification[]
): Record<string, DashboardNotification[]> {
  return notifications.reduce((groups, notification) => {
    const type = notification.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(notification)
    return groups
  }, {} as Record<string, DashboardNotification[]>)
}

/**
 * Formate le temps relatif pour les notifications
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Génère un ID unique pour une notification
 */
export function generateNotificationId(prefix: string = 'notification'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
