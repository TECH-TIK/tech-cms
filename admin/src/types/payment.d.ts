export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string | null;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  
  // Propriétés additionnelles pour la vue détaillée
  invoice_number?: string;
  client_name?: string;
  client_id?: number; // ID du client lié à cette facture
  invoice_total?: number; // Montant total de la facture
  invoice_status?: string; // Status de la facture associée
  invoice_date?: string; // Date de création de la facture
  
  // Alias pour compatibilité avec les vues existantes
  date?: string; // Alias pour payment_date
  method?: string; // Alias pour payment_method
  refunded_at?: string; // Date de remboursement si status === 'refunded'
}

export interface PaymentFormData {
  invoice_id: string | number;
  amount: string | number;
  method: string; // Utilisation de l'alias pour cohérence avec la vue
  status: string;
  transaction_id: string;
  notes: string;
}

export interface Invoice {
  id: number;
  product_id: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'deleted';
  created_at: string;
  updated_at: string | null;
  client_id: number;
  client_name?: string;
  product_name?: string;
  product_price?: string | number;
  total: number;
  
  // Propriétés pour InvoiceDetailsView.vue
  service_name?: string;
  service_id?: number;
  subtotal?: number;
  tax_amount?: number;
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  client_email?: string;
  
  // Alias pour compatibilité avec les vues existantes
  date?: string; // Alias pour created_at/due_date
  invoice_date?: string; // Alias pour created_at
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: string | number;
  tax_rate: number;
  amount?: number;
  total?: number; // Total pour l'item (quantité * prix unitaire)
}