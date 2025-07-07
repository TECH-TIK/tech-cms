import axios from './axios'
import logger from '@/services/logger'

/**
 * Utilitaire API simplifié pour les appels REST
 */
export const api = {
  /**
   * Effectue une requête GET
   */
  async get(url: string, params?: any) {
    try {
      const response = await axios.get(url, { params })
      return response
    } catch (error) {
      logger.error(`Erreur GET ${url}`, { error, url })
      throw error
    }
  },

  /**
   * Effectue une requête POST
   */
  async post(url: string, data?: any) {
    try {
      const response = await axios.post(url, data)
      return response
    } catch (error) {
      logger.error(`Erreur POST ${url}`, { error, url })
      throw error
    }
  },

  /**
   * Effectue une requête PUT
   */
  async put(url: string, data?: any) {
    try {
      const response = await axios.put(url, data)
      return response
    } catch (error) {
      logger.error(`Erreur PUT ${url}`, { error, url })
      throw error
    }
  },

  /**
   * Effectue une requête DELETE
   */
  async delete(url: string) {
    try {
      const response = await axios.delete(url)
      return response
    } catch (error) {
      logger.error(`Erreur DELETE ${url}`, { error, url })
      throw error
    }
  },

  /**
   * Effectue une requête PATCH
   */
  async patch(url: string, data?: any) {
    try {
      const response = await axios.patch(url, data)
      return response
    } catch (error) {
      logger.error(`Erreur PATCH ${url}`, { error, url })
      throw error
    }
  }
}

export default api
