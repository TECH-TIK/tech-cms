export interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireNumbers: boolean;
  requireSymbols: boolean;
  requireUppercase: boolean;
}

export interface ApiKey {
  id: string | number;
  name: string;
  key?: string;
  token?: string;
  created_at?: string;
  createdAt?: string;
  last_used?: string;
  lastUsed?: string;
  expiresAt?: string;
  permissions?: string[];
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
  ipWhitelist: string[];
  apiKeys: ApiKey[];
}

export interface PaymentGateway {
  enabled: boolean;
  testMode?: boolean;
  publishableKey?: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
  sandbox?: boolean;
  details?: string;
  id?: string;
  name?: string;
  config?: {
    publicKey?: string;
    secretKey?: string;
    clientId?: string;
    clientSecret?: string;
    sandbox?: boolean;
    details?: string;
  };
}

export interface BillingSettings {
  vatRate: number;
  defaultPaymentTerms: number;
  paymentMethods: {
    stripe: PaymentGateway;
    paypal: PaymentGateway;
  } | PaymentGateway[];
  invoicePrefix: string;
  autoReminders: boolean;
  reminderDays: number[];
  
  // Propriétés utilisées dans BillingView.vue
  general?: {
    invoicePrefix: string;
    nextInvoiceNumber: number;
    defaultDueDays: number;
    autoSendInvoices: boolean;
    autoSendReceipts: boolean;
    enableTaxes: boolean;
    defaultTaxName: string;
    defaultTaxRate: number;
    taxNumberRequired: boolean;
  };
}

export interface NotificationType {
  id: string;
  name: string;
  enabled: boolean;
  email: boolean;
  inApp: boolean;
}

export interface NotificationSettingsData {
  enableEmailNotifications: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: string;
  smtpUsername: string;
  smtpPassword: string;
  emailFrom: string;
  emailFromName: string;
}

export interface NotificationSettings {
  settings?: NotificationSettingsData;
  types?: NotificationType[];
}

export interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: string;
}

export interface Webhook {
  id: string | number;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  created_at?: string;
  updated_at?: string;
  last_triggered_at?: string;
  failures?: number;
}

export interface IntegrationSettings {
  smtp: SmtpSettings;
  webhooks: Webhook[];
  apiKeys?: ApiKey[];
}

export interface MiscAutomationSettings {
  db_cleanup_enabled: boolean;
  db_cleanup_frequency: string;
  cleanup_sessions: boolean;
  cleanup_activity_logs: boolean;
  cleanup_temp_data: boolean;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  backup_files: boolean;
  backup_database: boolean;
  compress_backup: boolean;
  backups_to_keep: number;
  auto_reports_enabled: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  email_reports: boolean;
}

export interface AutomationSettings {
  misc: MiscAutomationSettings;
  // D'autres groupes de paramètres d'automatisation peuvent être ajoutés ici
}

export interface AppSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  billing: BillingSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  automation: AutomationSettings;
}

export interface LicenseInfo {
  key?: string;
  status: 'valid' | 'invalid' | 'expired';
  expires_at?: string;
  registered_to?: string;
  product?: string;
  type?: string;
  features?: string[];
  domains?: string[];
  activations?: number;
  max_activations?: number;
  message?: string;
}