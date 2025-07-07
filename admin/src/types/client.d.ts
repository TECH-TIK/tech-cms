/**
 * Types pour les clients
 */

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  vat_number?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  vat_number: string;
  company_name: string;
}
