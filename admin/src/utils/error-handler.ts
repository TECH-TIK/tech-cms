// Gestionnaire d'erreurs global
export const handleError = (error: any) => {
  console.error('Error:', error)
  
  if (error.response) {
    // Erreur de réponse du serveur
    console.error('Response data:', error.response.data)
    console.error('Response status:', error.response.status)
    console.error('Response headers:', error.response.headers)
  } else if (error.request) {
    // Pas de réponse du serveur
    console.error('Request:', error.request)
  } else {
    // Erreur lors de la configuration de la requête
    console.error('Error message:', error.message)
  }

  // Retourner un message d'erreur approprié
  if (error.response?.data?.message) {
    return error.response.data.message
  } else if (error.message) {
    return error.message
  } else {
    return 'Une erreur inattendue est survenue'
  }
}
