import { defineStore } from 'pinia'
import { ref } from 'vue'
import logger from '@/services/logger'
import { ApiService } from '@/services/api'

export interface ProductGroup {
  id: number
  name: string
  slug: string
  description?: string
  created_at?: string
  updated_at?: string
}

export const useProductGroupsStore = defineStore('productGroups', () => {
  const productGroups = ref<ProductGroup[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Récupérer tous les groupes de produits
  const fetchProductGroups = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await ApiService.routes.admin.productGroup.list()
      productGroups.value = response.data.productGroups || []
    } catch (err: any) {
            logger.error('Erreur lors de la récupération des groupes de produits', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des groupes de produits'
    } finally {
      loading.value = false
    }
  }

  // Créer un nouveau groupe de produits
  const createProductGroup = async (groupData: Omit<ProductGroup, 'id'>) => {
    loading.value = true
    error.value = null
    try {
      const response = await ApiService.routes.admin.productGroup.create(groupData)
      productGroups.value.push(response.data)
      return response.data
    } catch (err: any) {
            logger.error('Erreur lors de la création du groupe de produits', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors de la création du groupe de produits'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Mettre à jour un groupe de produits
  const updateProductGroup = async (id: number, groupData: Partial<Omit<ProductGroup, 'id'>>) => {
    loading.value = true
    error.value = null
    try {
      const response = await ApiService.routes.admin.productGroup.update(String(id), groupData)
      const index = productGroups.value.findIndex(group => group.id === id)
      if (index !== -1) {
        productGroups.value[index] = response.data
      }
      return response.data
    } catch (err: any) {
            logger.error('Erreur lors de la mise à jour du groupe de produits', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour du groupe de produits'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Supprimer un groupe de produits
  const deleteProductGroup = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await ApiService.routes.admin.productGroup.delete(String(id))
      productGroups.value = productGroups.value.filter(group => group.id !== id)
      return true
    } catch (err: any) {
            logger.error('Erreur lors de la suppression du groupe de produits', { error: err })
      error.value = err.response?.data?.message || 'Erreur lors de la suppression du groupe de produits'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Obtenir le nom d'un groupe par son ID
  const getGroupName = (id: number): string => {
    // Vérifier que l'ID est valide
    if (!id) return '';
    
    // Trouver le groupe par son ID
    const group = productGroups.value.find(g => g.id === id);
    
    // Renvoyer le nom du groupe s'il existe, sinon une chaîne vide
    return group ? group.name : '';
  }

  return {
    productGroups,
    loading,
    error,
    fetchProductGroups,
    createProductGroup,
    updateProductGroup,
    deleteProductGroup,
    getGroupName
  }
})
