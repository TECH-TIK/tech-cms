export interface Ticket {
  id: number;
  subject: string;
  client_name: string;
  client_id?: number;
  department_id?: number;
  department_name?: string; // Nom du département
  status: string;
  priority: string;
  last_reply: string;
  created_at: string;
  updated_at?: string;
  closed_at?: string; // Date de fermeture du ticket
  messages?: TicketMessage[];
  replies?: TicketMessage[]; // Alias pour messages pour compatibilité
  message?: string; // Contenu initial du ticket
  assigned_to?: number; // ID de l'agent assigné
  assigned_to_name?: string; // Nom de l'agent assigné
  service_id?: number; // Service associé
  service_name?: string; // Nom du service associé
  notify_client?: boolean; // Notification au client
  auto_close?: boolean; // Fermeture automatique
  tags?: string[]; // Tags associés
  internal_notes?: string; // Notes internes
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  }; // Informations de pagination pour les réponses
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  user_type: 'admin' | 'client';
  message: string;
  author_name: string;
  is_staff: boolean;
  created_at: string;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: number;
  message_id: number;
  filename: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  url?: string;
}

export interface CreateTicketReply {
  message: string;
  attachments?: File[];
  notify_client?: boolean;
  close_after_reply?: boolean;
}

// Alias pour compatibilité
export type TicketReply = TicketMessage

export interface TicketDepartment {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface TicketFilter {
  status?: string;
  priority?: string;
  department_id?: number;
  from_date?: string;
  to_date?: string;
}