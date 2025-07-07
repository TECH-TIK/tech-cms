import logger from '@/services/logger'
import { ApiService } from '@/services/api'

// Interface pour les brouillons de produits
export interface ProductDraft {
  id?: number
  user_id: number
  data: any
  current_step: string
  created_at?: string
  updated_at?: string
}

// Interface pour la réponse de l'API
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Plus besoin du store token car ApiService gère déjà l'authentification

export const useProductDraftsService = () => {
  
  /**
   * Récupère tous les brouillons de produits de l'utilisateur
   */
  const getAllDrafts = async (): Promise<ApiResponse<ProductDraft[]>> => {
    try {
      const response = await ApiService.routes.admin.productDraft.list()
      return response.data
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des brouillons', { error })
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Une erreur est survenue'
      }
    }
  }

  /**
   * Récupère un brouillon spécifique par son ID
   */
  const getDraft = async (draftId: number): Promise<ApiResponse<ProductDraft>> => {
    try {
      const response = await ApiService.routes.admin.productDraft.get(draftId.toString())
      return response.data
    } catch (error: any) {
      logger.error(`Erreur lors de la récupération du brouillon #${draftId}`, { error, draftId })
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Une erreur est survenue'
      }
    }
  }

  /**
   * Sauvegarde un brouillon de produit (création ou mise à jour)
   */
  const saveDraft = async (data: any, currentStep: string, draftId?: number): Promise<ApiResponse<{ id: number }>> => {
    try {
      const payload = {
        data,
        current_step: currentStep
      }
      
      const response = draftId 
        ? await ApiService.routes.admin.productDraft.update(draftId.toString(), payload)
        : await ApiService.routes.admin.productDraft.create(payload)
      
      return response.data
    } catch (error: any) {
      logger.error('Erreur lors de la sauvegarde du brouillon', { error, draftId })
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Une erreur est survenue'
      }
    }
  }

  /**
   * Supprime un brouillon de produit
   */
  const deleteDraft = async (draftId: number): Promise<ApiResponse<null>> => {
    try {
      const response = await ApiService.routes.admin.productDraft.delete(draftId.toString())
      return response.data
    } catch (error: any) {
      logger.error(`Erreur lors de la suppression du brouillon #${draftId}`, { error, draftId })
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Une erreur est survenue'
      }
    }
  }

  return {
    getAllDrafts,
    getDraft,
    saveDraft,
    deleteDraft
  }
}
