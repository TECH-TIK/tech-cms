/**
 * Utilitaires pour la gestion et le formatage des dates et des prix
 *
 * Ce module fournit des fonctions sécurisées pour valider et formater les dates et les prix
 * en gérant les cas où les valeurs peuvent être null, undefined ou invalides.
 */

import logger from '@/services/logger'

/**
 * Valide si une date est valide
 * 
 * @param date - La date à valider (peut être string, Date, null, undefined)
 * @returns true si la date est valide, false sinon
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false
  if (typeof date === 'string' && date.trim() === '') return false
  
  const dateObj = new Date(date)
  return !isNaN(dateObj.getTime())
}

/**
 * Formate une date de manière sécurisée avec le format français court
 * 
 * @param date - La date à formater
 * @returns La date formatée ou un message d'erreur approprié
 */
export const formatDateShort = (date: string | null | undefined): string => {
  if (!isValidDate(date)) {
    return 'Date non définie'
  }
  
  try {
    const dateObj = new Date(date!)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/Paris'
    }).format(dateObj)
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors du formatage de la date (court)', { date, error })
    return 'Date invalide'
  }
}

/**
 * Formate une date de manière sécurisée avec le format français long
 * 
 * @param date - La date à formater
 * @returns La date formatée ou un message d'erreur approprié
 */
export const formatDateLong = (date: string | null | undefined): string => {
  if (!isValidDate(date)) {
    return 'Date non définie'
  }
  
  try {
    const dateObj = new Date(date!)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris'
    }).format(dateObj)
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors du formatage de la date (long)', { date, error })
    return 'Date invalide'
  }
}

/**
 * Formate une date et heure de manière sécurisée
 * 
 * @param date - La date à formater
 * @returns La date et heure formatées ou un message d'erreur approprié
 */
export const formatDateTime = (date: string | null | undefined): string => {
  if (!isValidDate(date)) {
    return 'Date non définie'
  }
  
  try {
    const dateObj = new Date(date!)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(dateObj)
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors du formatage de la date/heure', { date, error })
    return 'Date invalide'
  }
}

/**
 * Calcule le nombre de jours entre deux dates
 * 
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns Le nombre de jours ou null si une date est invalide
 */
export const daysBetween = (date1: string | null | undefined, date2: string | null | undefined): number | null => {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return null
  }
  
  try {
    const dateObj1 = new Date(date1!)
    const dateObj2 = new Date(date2!)
    const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors du calcul des jours', { date1, date2, error })
    return null
  }
}

/**
 * Vérifie si une date est dans le passé
 * 
 * @param date - La date à vérifier
 * @returns true si la date est dans le passé, false sinon
 */
export const isDateInPast = (date: string | null | undefined): boolean => {
  if (!isValidDate(date)) {
    return false
  }
  
  try {
    const dateObj = new Date(date!)
    const now = new Date()
    return dateObj < now
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors de la vérification de la date', { date, error })
    return false
  }
}

/**
 * Vérifie si une date est dans le futur
 *
 * @param date - La date à vérifier
 * @returns true si la date est dans le futur, false sinon
 */
export const isDateInFuture = (date: string | null | undefined): boolean => {
  if (!isValidDate(date)) {
    return false
  }

  try {
    const dateObj = new Date(date!)
    const now = new Date()
    return dateObj > now
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors de la vérification de la date', { date, error })
    return false
  }
}

// ===== UTILITAIRES POUR LES PRIX =====

/**
 * Valide si une valeur est un nombre valide pour un prix
 *
 * @param value - La valeur à valider
 * @returns true si la valeur est un nombre valide, false sinon
 */
export const isValidPrice = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false

  const numValue = Number(value)
  return !isNaN(numValue) && isFinite(numValue)
}

/**
 * Formate un prix de manière sécurisée avec la devise française
 *
 * @param value - Le prix à formater (peut être number, string, null, undefined)
 * @param showFreeLabel - Si true, affiche "Gratuit" pour les prix à 0, sinon "0,00 €"
 * @returns Le prix formaté ou "Gratuit" ou un message d'erreur approprié
 */
export const formatPrice = (value: number | string | null | undefined, showFreeLabel: boolean = true): string => {
  // Vérifier si la valeur est valide
  if (!isValidPrice(value)) {
    return showFreeLabel ? 'Gratuit' : '0,00 €'
  }

  try {
    const numValue = Number(value)

    // Si le prix est 0 et qu'on veut afficher "Gratuit"
    if (numValue === 0 && showFreeLabel) {
      return 'Gratuit'
    }

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(numValue)
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors du formatage du prix', { value, error })
    return showFreeLabel ? 'Gratuit' : '0,00 €'
  }
}

/**
 * Formate un prix simple sans devise
 *
 * @param value - Le prix à formater
 * @returns Le prix formaté sans devise ou "0" si invalide
 */
export const formatPriceSimple = (value: number | string | null | undefined): string => {
  if (!isValidPrice(value)) {
    return '0'
  }

  try {
    const numValue = Number(value)
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue)
  } catch (error) {
    logger.warn('[DATE_UTILS] Erreur lors du formatage du prix simple', { value, error })
    return '0'
  }
}
