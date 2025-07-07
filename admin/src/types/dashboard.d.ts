/**
 * Types pour le dashboard
 */

/**
 * Activité du tableau de bord
 */
export interface Activity {
  id: number | string;
  title: string;
  description: string;
  type: string; // 'client', 'ticket', 'billing', 'service'
  date: string;
}

/**
 * Interface pour le store dashboard
 */
export interface DashboardStore {
  // États
  loading: boolean;
  error: unknown | null;
  stats: DashboardStats;
  activity: DashboardActivity;
  
  // Actions
  fetchStats: () => Promise<void>;
  fetchActivity: () => Promise<void>;
  fetchRecentClients: (limit?: number) => Promise<RecentClient[]>;
  fetchRecentTickets: (limit?: number) => Promise<RecentTicket[]>;
}

/**
 * Client récent sur le tableau de bord
 */
export interface RecentClient {
  id: number | string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

/**
 * Ticket récent sur le tableau de bord
 */
export interface RecentTicket {
  id: number | string;
  title: string;
  client_name: string;
  status: string;
  priority: string;
  created_at: string;
}

/**
 * Statistiques du tableau de bord
 */
/**
 * Structure d'activité du dashboard
 */
export interface DashboardActivity {
  clients: RecentClient[];
  services: any[];
  tickets: RecentTicket[];
}

/**
 * Statistiques du tableau de bord
 */
export interface DashboardStats {
  clients: {
    total: number;
    active: number;
    new: number;
  };
  services: {
    total: number;
    active: number;
    pending: number;
  };
  tickets: {
    total: number;
    open: number;
    urgent: number;
  };
  revenue: {
    monthly: number;
  };
}
