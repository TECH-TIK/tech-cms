import axios from 'axios'

// Stub simple pour le token store si le module n'est pas disponible
interface TokenStore {
  token: string
}

// Version simplifiée du store token
export const useTokenStore = (): TokenStore => {
  // Récupérer le token depuis localStorage en fallback
  const token = localStorage.getItem('auth_token') || ''
  return { token }
}

export const useServerService = () => {
  const tokenStore = useTokenStore()
  const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || ''
  
  /**
   * Récupère les options de Virtualizor (types de virtualisation et templates OS)
   */
  const getVirtualizorOptions = async (serverId: number | null): Promise<any> => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/servers/${serverId}/virtualizor-options`, {
        headers: {
          Authorization: `Bearer ${tokenStore.token}`
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Erreur lors de la récupération des options Virtualizor:', error)
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
      const response = await axios.get(`${apiBaseUrl}/api/servers/${serverId}/proxmox-options`, {
        headers: {
          Authorization: `Bearer ${tokenStore.token}`
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Erreur lors de la récupération des options Proxmox:', error)
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
      const response = await axios.get(`${apiBaseUrl}/api/v1/servers/${serverId}/plans`, {
        headers: {
          Authorization: `Bearer ${tokenStore.token}`
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Erreur lors de la récupération des plans:', error)
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