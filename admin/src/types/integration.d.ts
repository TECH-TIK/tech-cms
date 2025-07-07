/**
 * Définitions de types pour les intégrations
 */

export interface ApiKey {
  id: string | number;
  name: string;
  token?: string;
  key?: string;
  createdAt?: string;
  created_at?: string;
  lastUsed?: string;
  last_used?: string;
  expiresAt?: string;
  permissions?: string[];
}

export interface WebhookEvent {
  id: string;
  name: string;
  group?: string;
}

export interface Webhook {
  id: string | number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  created_at?: string;
  updated_at?: string;
  last_triggered_at?: string;
  failures?: number;
}
