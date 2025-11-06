import api from '../api/api-client';
import {
  App,
  Integration,
  AppsListResponse,
  AppDetailsResponse,
  ConfigSchemaResponse,
  IntegrationsListResponse,
  IntegrationDetailsResponse,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  UpdateIntegrationConfigurationsRequest,
  OAuthInitiateRequest,
  OAuthInitiateResponse,
  TestConnectionResponse,
  SyncResponse,
  SyncStatusResponse,
  ApiErrorResponse,
} from '@/types/integrations';

class IntegrationsService {
  private baseUrl = '/api/v1';

  // Helper function to normalize config schema field
  private normalizeConfigField(rawField: any): any {
    return {
      key: rawField.key || '',
      label: rawField.label || '',
      type: rawField.type || 'text',
      required: rawField.required !== undefined ? rawField.required : false,
      category: rawField.category,
      placeholder: rawField.placeholder,
      help_text: rawField.help_text || rawField.helpText,
      default: rawField.default,
      options: rawField.options,
      validation: rawField.validation,
    };
  }

  // Helper function to normalize App from API response (handles both camelCase and snake_case)
  private normalizeApp(rawApp: any): App {
    const configSchema = rawApp.configSchema || rawApp.config_schema;
    const normalizedSchema = configSchema
      ? {
          fields: Array.isArray(configSchema.fields)
            ? configSchema.fields.map((field: any) => this.normalizeConfigField(field))
            : [],
        }
      : undefined;

    return {
      id: typeof rawApp.id === 'string' ? parseInt(rawApp.id, 10) : rawApp.id,
      name: rawApp.name || '',
      category: rawApp.category || '',
      logo_url: rawApp.logoUrl || rawApp.logo_url,
      base_url: rawApp.baseUrl || rawApp.base_url,
      description: rawApp.description,
      auth_type: (rawApp.authType || rawApp.auth_type || 'api_key') as any,
      oauth_provider: (rawApp.oauthProvider || rawApp.oauth_provider || null) as any,
      documentation_url: rawApp.documentationUrl || rawApp.documentation_url,
      config_schema: normalizedSchema,
      is_active: rawApp.isActive !== undefined ? rawApp.isActive : rawApp.is_active !== undefined ? rawApp.is_active : true,
      created_at: rawApp.createdAt || rawApp.created_at || new Date().toISOString(),
      updated_at: rawApp.updatedAt || rawApp.updated_at || new Date().toISOString(),
    };
  }

  // Helper function to normalize Integration from API response
  private normalizeIntegration(rawIntegration: any): Integration {
    return {
      id: typeof rawIntegration.id === 'string' ? parseInt(rawIntegration.id, 10) : rawIntegration.id,
      user_id: rawIntegration.userId || rawIntegration.user_id || 0,
      account_id: rawIntegration.accountId || rawIntegration.account_id || 0,
      app_id: rawIntegration.appId || rawIntegration.app_id || 0,
      app: rawIntegration.app ? this.normalizeApp(rawIntegration.app) : undefined,
      status: (rawIntegration.status || 'pending') as any,
      enabled: rawIntegration.enabled !== undefined ? rawIntegration.enabled : true,
      connected_at: rawIntegration.connectedAt || rawIntegration.connected_at,
      last_synced_at: rawIntegration.lastSyncedAt || rawIntegration.last_synced_at,
      sync_frequency: (rawIntegration.syncFrequency || rawIntegration.sync_frequency || 'hourly') as any,
      error_message: rawIntegration.errorMessage || rawIntegration.error_message,
      metadata: rawIntegration.metadata,
      configurations: rawIntegration.configurations,
      created_at: rawIntegration.createdAt || rawIntegration.created_at || new Date().toISOString(),
      updated_at: rawIntegration.updatedAt || rawIntegration.updated_at || new Date().toISOString(),
    };
  }

  // App Management APIs

  async getApps(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<AppsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

      const url = queryParams.toString()
        ? `${this.baseUrl}/apps?${queryParams.toString()}`
        : `${this.baseUrl}/apps`;

      const response = await api.get(url);
      const data = response.data;
      
      // Normalize apps
      if (data?.data?.items && Array.isArray(data.data.items)) {
        data.data.items = data.data.items.map((app: any) => this.normalizeApp(app));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching apps:', error);
      throw error;
    }
  }

  async getAppById(id: number): Promise<AppDetailsResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/apps/${id}`);
      const data = response.data;
      
      // Normalize app
      if (data?.data?.app) {
        data.data.app = this.normalizeApp(data.data.app);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching app:', error);
      throw error;
    }
  }

  async getAppConfigSchema(appId: number): Promise<ConfigSchemaResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/apps/${appId}/config-schema`);
      return response.data;
    } catch (error) {
      console.error('Error fetching config schema:', error);
      throw error;
    }
  }

  async createApp(data: Partial<App>): Promise<AppDetailsResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/apps`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating app:', error);
      throw error;
    }
  }

  async updateApp(id: number, data: Partial<App>): Promise<AppDetailsResponse> {
    try {
      const response = await api.patch(`${this.baseUrl}/apps/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating app:', error);
      throw error;
    }
  }

  async deleteApp(id: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/apps/${id}`);
    } catch (error) {
      console.error('Error deleting app:', error);
      throw error;
    }
  }

  // Integration Management APIs

  async getIntegrations(params?: {
    status?: string;
    app_id?: number;
    enabled?: boolean;
    page?: number;
    limit?: number;
  }): Promise<IntegrationsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.app_id) queryParams.append('app_id', params.app_id.toString());
      if (params?.enabled !== undefined) queryParams.append('enabled', params.enabled.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = queryParams.toString()
        ? `${this.baseUrl}/integrations?${queryParams.toString()}`
        : `${this.baseUrl}/integrations`;

      const response = await api.get(url);
      const data = response.data;
      
      // Normalize integrations
      if (data?.data?.items && Array.isArray(data.data.items)) {
        data.data.items = data.data.items.map((integration: any) => this.normalizeIntegration(integration));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  async getIntegrationById(id: number): Promise<IntegrationDetailsResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/integrations/${id}`);
      const data = response.data;
      
      // Normalize integration
      if (data?.data?.integration) {
        data.data.integration = this.normalizeIntegration(data.data.integration);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching integration:', error);
      throw error;
    }
  }

  async createIntegration(data: CreateIntegrationRequest): Promise<IntegrationDetailsResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/integrations`, data);
      const responseData = response.data;
      
      // Normalize integration in response
      if (responseData?.data?.integration) {
        responseData.data.integration = this.normalizeIntegration(responseData.data.integration);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  async updateIntegration(id: number, data: UpdateIntegrationRequest): Promise<IntegrationDetailsResponse> {
    try {
      const response = await api.patch(`${this.baseUrl}/integrations/${id}`, data);
      const responseData = response.data;
      
      // Normalize integration in response
      if (responseData?.data?.integration) {
        responseData.data.integration = this.normalizeIntegration(responseData.data.integration);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }

  async updateIntegrationConfigurations(
    id: number,
    data: UpdateIntegrationConfigurationsRequest,
  ): Promise<IntegrationDetailsResponse> {
    try {
      const response = await api.patch(`${this.baseUrl}/integrations/${id}/configurations`, data);
      const responseData = response.data;
      
      // Normalize integration in response
      if (responseData?.data?.integration) {
        responseData.data.integration = this.normalizeIntegration(responseData.data.integration);
      }
      
      return responseData;
    } catch (error) {
      console.error('Error updating integration configurations:', error);
      throw error;
    }
  }

  async testIntegration(id: number): Promise<TestConnectionResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/integrations/${id}/test`);
      return response.data;
    } catch (error) {
      console.error('Error testing integration:', error);
      throw error;
    }
  }

  async triggerSync(id: number): Promise<SyncResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/integrations/${id}/sync`);
      return response.data;
    } catch (error) {
      console.error('Error triggering sync:', error);
      throw error;
    }
  }

  async getSyncStatus(id: number): Promise<SyncStatusResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/integrations/${id}/sync/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sync status:', error);
      throw error;
    }
  }

  async deleteIntegration(id: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/integrations/${id}`);
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }

  // OAuth Integration APIs

  async initiateOAuth(data: OAuthInitiateRequest): Promise<OAuthInitiateResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/integrations/oauth/initiate`, data);
      return response.data;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      throw error;
    }
  }
}

export const integrationsService = new IntegrationsService();
export default IntegrationsService;
