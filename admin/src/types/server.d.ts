export interface ServerStats {
  status: 'online' | 'offline';
  load: number[];
  memory: {
    used: number;
    total: number;
    percent: number;
  };
  disk: {
    used: number;
    total: number;
    percent: number;
  };
  uptime: number;
  last_updated: string;
  server_load?: number;
}

export interface Server {
  id?: number;
  name: string;
  hostname: string;
  type: string; // Type dynamique basé sur les modules
  ip: string;
  port: number;
  username: string;
  secure: boolean;
  active: boolean;
  maxAccounts?: number;
  nameservers?: string;
  status?: string;
  stats?: ServerStats;
  loadingStats?: boolean;
  lastUpdated?: string;
  api_token?: string;
  password?: string;
  last_check?: string;
}

export interface ServerModule {
  name: string;
  display_name?: string;
  type?: string;
}
