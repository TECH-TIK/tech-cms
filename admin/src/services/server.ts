import logger from '@/services/logger'
import { ApiService } from '@/services/api'

export const useServerService = () => {
  
  /**
   * Récupère les options de Virtualizor (types de virtualisation et templates OS)
   */
  const getVirtualizorOptions = async (serverId: number | null): Promise<any> => {
    try {
      if (!serverId) {
        throw new Error('ID du serveur requis')
      }
      const response = await ApiService.routes.admin.system.server.getVirtualizorOptions(serverId.toString())
      return response.data
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des options Virtualizor', { error, serverId })
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Une erreur est survenue'
      }
    }
  }

  /**
   * Récupère les options de Proxmox (stockages et templates)
   */
  const getProxmoxOptions = async (serverId: number | null): Promise<any> => {
    try {
      if (!serverId) {
        throw new Error('ID du serveur requis')
      }
      const response = await ApiService.routes.admin.system.server.getProxmoxOptions(serverId.toString())
      return response.data
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des options Proxmox', { error, serverId })
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Une erreur est survenue'
      }
    }
  }

  /**
   * Récupère les plans pour un serveur cPanel
   */
  const getServerPlans = async (serverId: number | null): Promise<any> => {
    try {
      if (!serverId) {
        throw new Error('ID du serveur requis')
      }
      const response = await ApiService.routes.admin.system.server.getPlans(serverId.toString())
      return response.data
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des plans', { error, serverId })
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Une erreur est survenue'
      }
    }
  }

  return {
    getVirtualizorOptions,
    getProxmoxOptions,
    getServerPlans
  }
} 