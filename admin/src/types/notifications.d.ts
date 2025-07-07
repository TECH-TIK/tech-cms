export interface Notification {
  id: number | string;
  read: boolean;
  created_at: string;
  createdAt?: string; // Alias de created_at pour compatibilité avec NotificationsView
  title: string;
  message: string;
  type: 'ticket' | 'invoice' | 'payment' | 'client' | 'system' | string;
  link?: string;
  status?: 'read' | 'unread'; // Pour les composants utilisant status au lieu de read
  icon?: string; // Classe d'icône pour l'affichage (ex: 'fas fa-bell')
  time?: string; // Horodatage pour l'affichage dans AppHeader
}

// Type pour les notifications telles qu'utilisées dans NotificationsView
export interface AppNotification extends Omit<Notification, 'read' | 'created_at'> {
  createdAt: string;
  status: 'read' | 'unread';
}

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
  closing?: boolean;
}
