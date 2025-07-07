export interface ProductCategory {
  id: number | string;
  name: string;
}

export interface Product {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  color?: string;
  image_url?: string;
  type?: string;
  price?: number;
  status?: string; // 'active', 'maintenance', 'inactive', etc.
  upgrade_products?: (string | number)[];
  provisioning_type?: string;
  server_type?: string;
  group_id?: number | null;
  product_type?: string;
  welcome_email?: number | null;
  welcome_email_id?: number | null; // Alias pour welcome_email pour compatibilité
  featured?: boolean;
  tag_line?: string;
  order_link?: string;
  features?: any[];
  // Champs de tarification
  setup_fee?: number;
  recurring?: boolean;
  price_monthly?: number;
  price_quarterly?: number;
  price_semiannually?: number;
  price_annually?: number;
  price_biennially?: number;
  price_triennially?: number;
  default_billing_cycle?: string;
  allow_cycle_change?: boolean;
  tax_included?: boolean;
  tax_exempt?: boolean;
  links?: { label: string; url: string }[];
  downloads?: number[];
  custom_fields?: any[];
}
