/**
 * Types pour les services
 */

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  client_id?: number;
  product_id?: number;
  recurring?: boolean;
  billing_cycle?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface ServiceFormData {
  name: string;
  description: string;
  price: number | string;
  client_id?: number | string;
  product_id?: number | string;
  recurring: boolean;
  billing_cycle: string;
}
