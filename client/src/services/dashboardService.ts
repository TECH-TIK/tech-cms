/**
 * Service API pour le dashboard client
 *
 * Gère les appels API pour récupérer les données du dashboard client
 * Utilise le service API centralisé pour maintenir la cohérence
 */

import { ApiService } from './api'

// Interfaces TypeScript
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

export interface Service {
  id: number
  name: string
  type: string
  status: string
  price: number
  created_at: string
}

export interface Invoice {
  id: number
  number: string
  amount: number
  status: string
  created_at: string
  due_date?: string
}

export interface Ticket {
  id: number
  title: string
  status: string
  priority?: string
  created_at: string
}

export interface DashboardOverview {
  recent_services: Service[]
  recent_invoices: Invoice[]
  recent_tickets: Ticket[]
  unpaid_invoices: Invoice[]
  open_tickets: Ticket[]
}

/**
 * Service Dashboard Client
 */
export class DashboardService {
  
  /**
   * Récupère les statistiques du dashboard
   */
  static async getStats(): Promise<DashboardStats> {
    try {
      const response = await ApiService.routes.client.dashboard.getStats()
      return response.data
    } catch (error: any) {
      console.error('[DashboardService] Erreur lors de la récupération des statistiques:', error)
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des statistiques')
    }
  }

  /**
   * Récupère la vue d'ensemble complète du dashboard
   */
  static async getOverview(): Promise<DashboardOverview> {
    try {
      const response = await ApiService.routes.client.dashboard.getOverview()
      return response.data
    } catch (error: any) {
      console.error('[DashboardService] Erreur lors de la récupération de la vue d\'ensemble:', error)
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération de la vue d\'ensemble')
    }
  }

  /**
   * Récupère les services récents
   */
  static async getRecentServices(): Promise<Service[]> {
    try {
      const response = await ApiService.routes.client.service.getRecent()
      return response.data
    } catch (error: any) {
      console.error('[DashboardService] Erreur lors de la récupération des services récents:', error)
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des services récents')
    }
  }

  /**
   * Récupère les factures récentes
   */
  static async getRecentInvoices(): Promise<Invoice[]> {
    try {
      const response = await ApiService.routes.client.invoice.getRecent()
      return response.data
    } catch (error: any) {
      console.error('[DashboardService] Erreur lors de la récupération des factures récentes:', error)
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des factures récentes')
    }
  }

  /**
   * Récupère les factures impayées
   */
  static async getUnpaidInvoices(): Promise<Invoice[]> {
    try {
      const response = await ApiService.routes.client.invoice.getUnpaid()
      return response.data
    } catch (error: any) {
      console.error('[DashboardService] Erreur lors de la récupération des factures impayées:', error)
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des factures impayées')
    }
  }

  /**
   * Récupère les tickets récents
   */
  static async getRecentTickets(): Promise<Ticket[]> {
    try {
      const response = await ApiService.routes.client.ticket.getRecent()
      return response.data
    } catch (error: any) {
      console.error('[DashboardService] Erreur lors de la récupération des tickets récents:', error)
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des tickets récents')
    }
  }

  /**
   * Récupère les tickets ouverts
   */
  static async getOpenTickets(): Promise<Ticket[]> {
    try {
      const response = await ApiService.routes.client.ticket.getOpen()
      return response.data
    } catch (error: any) {
      console.error('[DashboardService] Erreur lors de la récupération des tickets ouverts:', error)
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des tickets ouverts')
    }
  }
}