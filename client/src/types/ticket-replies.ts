/**
 * Types TypeScript pour les réponses aux tickets côté client
 * Types indépendants pour le portail client TechCMS
 *
 * @package TechCMS
 * @version 1.0.0
 */

/**
 * Interface pour une réponse/message de ticket côté client
 */
export interface TicketReply {
  id: number
  ticket_id: number
  user_id: number
  user_type: 'admin' | 'client'
  message: string
  author_name: string
  is_staff: boolean
  created_at: string
  attachments?: TicketAttachment[]
}

/**
 * Interface pour les pièces jointes des messages
 */
export interface TicketAttachment {
  id: number
  message_id: number
  filename: string
  file_path: string
  file_size?: number
  file_type?: string
  url?: string
}

/**
 * Interface pour créer une nouvelle réponse côté client
 */
export interface CreateTicketReply {
  message: string
  attachments?: File[]
}

/**
 * Interface spécifique au client pour le formulaire de réponse
 */
export interface ClientReplyForm {
  message: string
  attachments: File[]
}

/**
 * Interface pour l'état local du composant de détail ticket client
 */
export interface TicketDetailState {
  ticket: any | null
  replies: TicketReply[]
  loading: boolean
  submitting: boolean
  error: string | null
  replyForm: ClientReplyForm
  selectedFiles: File[]
}
