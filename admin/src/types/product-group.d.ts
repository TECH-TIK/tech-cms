/**
 * Définitions de types pour les groupes de produits
 */

export interface ProductGroup {
  id?: number; // L'ID doit être un nombre selon ProductGroupModal.vue
  name: string;
  slug: string;
  description: string;
  color?: string;
}
