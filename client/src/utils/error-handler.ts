import logger from '@/services/logger';

// Gestionnaire d'erreurs global
export const handleError = (error: any) => {
  const context: { [key: string]: any } = {
    message: error.message,
    stack: error.stack,
  };

  if (error.response) {
    context.response = {
      data: error.response.data,
      status: error.response.status,
      headers: error.response.headers,
    };
  } else if (error.request) {
    context.request = error.request;
  }

  logger.error('Une erreur globale a été interceptée', context);

  // Retourner un message d'erreur approprié
  if (error.response?.data?.message) {
    return error.response.data.message
  } else if (error.message) {
    return error.message
  } else {
    return 'Une erreur inattendue est survenue'
  }
}
