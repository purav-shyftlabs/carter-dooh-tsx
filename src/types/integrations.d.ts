// App Integration Types

export type AuthType = 'api_key' | 'oauth' | 'basic_auth';

export type OAuthProvider = 'slack' | 'google' | 'github' | 'microsoft' | null;

export type IntegrationStatus = 'connected' | 'error' | 'disconnected' | 'pending';

export type SyncFrequency = 'real-time' | 'hourly' | 'daily';

export type FieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'url'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'time';

export type FieldCategory = 'auth' | 'preference' | 'config';

export interface ConfigFieldOption {
  value: string;
  label: string;
}

export interface ConfigFieldValidation {
  pattern?: string;
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  custom_error?: string;
}

export interface ConfigSchemaField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  category?: FieldCategory;
  placeholder?: string;
  help_text?: string;
  default?: string | number | boolean;
  options?: ConfigFieldOption[];
  validation?: ConfigFieldValidation;
}

export interface ConfigSchema {
  fields: ConfigSchemaField[];
}

export interface App {
  id: number;
  name: string;
  category: string;
  logo_url?: string;
  base_url?: string;
  description?: string;
  auth_type: AuthType;
  oauth_provider?: OAuthProvider;
  documentation_url?: string;
  config_schema?: ConfigSchema;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConfiguration {
  id?: number;
  key: string;
  value: string | number | boolean;
}

export interface Integration {
  id: number;
  user_id: number;
  account_id: number;
  app_id: number;
  app?: App;
  status: IntegrationStatus;
  enabled: boolean;
  connected_at?: string;
  last_synced_at?: string;
  sync_frequency: SyncFrequency;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  configurations?: IntegrationConfiguration[];
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AppsListResponse {
  success: boolean;
  message: string;
  data: {
    items: App[];
    pagination: PaginationMeta;
  };
  timestamp: string;
}

export interface AppDetailsResponse {
  success: boolean;
  message: string;
  data: {
    app: App;
  };
  timestamp: string;
}

export interface ConfigSchemaResponse {
  success: boolean;
  message: string;
  data: ConfigSchema;
  timestamp: string;
}

export interface IntegrationsListResponse {
  success: boolean;
  message: string;
  data: {
    items: Integration[];
    pagination: PaginationMeta;
  };
  timestamp: string;
}

export interface IntegrationDetailsResponse {
  success: boolean;
  message: string;
  data: {
    integration: Integration;
  };
  timestamp: string;
}

export interface CreateIntegrationRequest {
  app_id: number;
  sync_frequency?: SyncFrequency;
  configurations: IntegrationConfiguration[];
}

export interface UpdateIntegrationRequest {
  enabled?: boolean;
  sync_frequency?: SyncFrequency;
}

export interface UpdateIntegrationConfigurationsRequest {
  configurations: IntegrationConfiguration[];
}

export interface OAuthInitiateRequest {
  app_id: number;
  redirect_uri: string;
}

export interface OAuthInitiateResponse {
  success: boolean;
  message: string;
  data: {
    state: string;
    authorization_url: string;
  };
  timestamp: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  data: {
    connection_status: 'success' | 'failed';
    message: string;
    tested_at: string;
    test_result?: Record<string, unknown>;
    error_code?: string;
  };
  timestamp: string;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  data: {
    synced_at: string;
    records_synced: number;
    sync_result?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface SyncStatusResponse {
  success: boolean;
  message: string;
  data: {
    last_synced_at?: string;
    next_sync_at?: string;
    sync_frequency: SyncFrequency;
    status: string;
    enabled: boolean;
  };
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  provided?: string;
  valid_options?: string[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: ValidationError[];
  details?: Record<string, unknown>;
  timestamp: string;
}

