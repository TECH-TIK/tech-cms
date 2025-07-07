/**
 * Types pour les abonnements (subscriptions)
 */

import type { Invoice } from './payment';

export interface Subscription {
  id?: number;
  client_id: number;
  product_id: number;
  start_date: string;
  end_date: string | null;
  renewal_date?: string | null;
  next_billing_date?: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  price: number;
  billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  auto_renew: boolean;
  send_notifications?: boolean;
  server_id?: string | number | null;
  domain?: string;
  username?: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string | null;
  cancelled_at?: string | null;
  
  // Propriétés calculées/relations
  client_name?: string;
  product_name?: string;
  server_name?: string;
  invoices?: Invoice[];
}

export interface SubscriptionFormData {
  id?: number | null;
  client_id: string | number;
  product_id: string | number;
  start_date: string;
  end_date: string;
  billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  next_billing_date: string;
  price: number;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  server_id: string | number;
  domain: string;
  username: string;
  auto_renew: boolean;
  send_notifications: boolean;
  notes: string;
}