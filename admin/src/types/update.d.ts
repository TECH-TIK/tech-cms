/**
 * Types TypeScript pour le système de mise à jour TechCMS
 * 
 * @package TechCMS
 * @version 1.0.0
 */

export interface SystemUpdate {
  id: number;
  version_from: string;
  version_to: string;
  status: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed' | 'rolled_back';
  download_token?: string;
  download_url?: string;
  changelog?: string;
  file_path?: string;
  file_size?: number;
  checksum?: string;
  backup_id?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface UpdateSettings {
  id: number;
  auto_check: boolean;
  auto_download: boolean;
  auto_install: boolean;
  check_interval: number;
  backup_before_update: boolean;
  notification_email?: string;
  last_check?: string;
  last_available_version?: string;
  created_at: string;
  updated_at?: string;
}

export interface AvailableVersion {
  version: string;
  release_date: string;
  status: string;
  changelog?: string;
  download_token?: string;
  download_url?: string;
  file_size?: number;
  checksum?: string;
}

export interface UpdateCheckResponse {
  success: boolean;
  updates_available: boolean;
  current_version: string;
  versions: AvailableVersion[];
  last_check: string;
  settings: UpdateSettings;
}

export interface UpdateDownloadResponse {
  success: boolean;
  message: string;
  update_id?: number;
  file_path?: string;
  file_size?: number;
  version?: string;
  error?: string;
}

export interface UpdateHistoryResponse {
  success: boolean;
  data: SystemUpdate[];
  stats: UpdateStats;
  total: number;
}

export interface UpdateStats {
  total: number;
  by_status: {
    [key: string]: {
      count: number;
      last_update: string;
    };
  };
  last_update?: string;
}

export interface UpdateSettingsResponse {
  success: boolean;
  data: UpdateSettings;
}

export interface UpdateValidationErrors {
  [key: string]: string;
}

export interface UpdateSettingsUpdateResponse {
  success: boolean;
  message: string;
  data?: UpdateSettings;
  errors?: UpdateValidationErrors;
}

export interface TokenValidationResponse {
  success: boolean;
  valid: boolean;
  message: string;
}

export interface UpdateCleanupResponse {
  success: boolean;
  message: string;
  deleted_files: number;
  deleted_records: number;
}

export interface UpdateProgress {
  update_id: number;
  status: string;
  progress: number;
  message: string;
  error?: string;
}

export interface UpdateFormData {
  auto_check: boolean;
  auto_download: boolean;
  auto_install: boolean;
  check_interval: number;
  backup_before_update: boolean;
  notification_email: string;
}

export interface UpdateModalState {
  show: boolean;
  type: 'download' | 'install' | 'progress';
  title: string;
  version?: string;
  token?: string;
  update_id?: number;
  progress?: UpdateProgress;
}

export interface UpdateNotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface UpdateTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface UpdateTablePagination {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface UpdateFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  version?: string;
}

export interface UpdateSortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface UpdateCardData {
  current_version: string;
  updates_available: number;
  last_check?: string;
  last_update?: string;
  auto_check_enabled: boolean;
  auto_download_enabled: boolean;
  auto_install_enabled: boolean;
}

export interface UpdateSystemInfo {
  version: string;
  license_key: string;
  domain: string;
  last_check?: string;
  next_check?: string;
  updates_available: number;
  pending_downloads: number;
  failed_updates: number;
}

export interface UpdateInstallResponse {
  success: boolean;
  message: string;
  update_id?: number;
  version?: string;
  backup_id?: string;
  duration?: number;
  error?: string;
}

export interface UpdateRollbackResponse {
  success: boolean;
  message: string;
  update_id?: number;
  backup_id?: string;
  duration?: number;
  error?: string;
}

export interface UpdateRequirement {
  name: string;
  required: boolean;
  status: boolean;
  message: string;
}

export interface UpdateRequirementsResponse {
  success: boolean;
  all_passed: boolean;
  requirements: { [key: string]: UpdateRequirement };
}

export interface UpdateBackup {
  id: string;
  file: string;
  date: string;
  version: string;
  size: number;
  formatted_size: string;
  created_at: string;
}

export interface UpdateBackupsResponse {
  success: boolean;
  backups: UpdateBackup[];
}

export interface UpdateInstallProgress {
  step: 'verify' | 'backup' | 'extract' | 'validate' | 'apply' | 'version' | 'cleanup';
  step_name: string;
  progress: number;
  message: string;
  error?: string;
}

export interface UpdateInstallModalState extends UpdateModalState {
  install_progress?: UpdateInstallProgress;
  backup_id?: string;
  requirements_checked?: boolean;
  requirements_passed?: boolean;
  failed_requirements?: UpdateRequirement[];
}
