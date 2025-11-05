import api from '../api/api-client';

export type IntegrationCategory = 'weather' | 'news' | 'social' | 'utility' | 'finance' | 'sports' | 'entertainment';
export type IntegrationAuthType = 'none' | 'oauth2' | 'api_key';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface IntegrationAppMetaSchemaField {
  type: string;
  required?: boolean;
  description?: string;
  default?: string | number | boolean;
}

export interface IntegrationAppMetadata {
  rateLimit?: string;
  apiKeyRequired?: boolean;
  settingsSchema?: Record<string, IntegrationAppMetaSchemaField>;
}

export interface IntegrationAppItem {
  id: number;
  name: string;
  slug: string;
  category: IntegrationCategory;
  logoUrl?: string;
  description?: string;
  authType: IntegrationAuthType;
  baseUrl?: string;
  metadata?: IntegrationAppMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntegrationSettingItem {
  id?: number;
  key: string;
  value: string | number | boolean | null;
}

export interface AccountIntegrationItem {
  id: number;
  accountId: number;
  userId: number;
  integrationAppId: number;
  status: IntegrationStatus;
  isActive: boolean;
  lastSyncTimestamp?: string | null;
  createdAt?: string;
  updatedAt?: string;
  integrationApp?: Partial<IntegrationAppItem>;
  settings?: IntegrationSettingItem[];
  oauthCredential?: any;
}

export interface AccountIntegrationsResponse {
  items: AccountIntegrationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    localtime?: string;
  };
  current?: {
    lastUpdated: string;
    temperature: {
      celsius: number;
      fahrenheit: number;
      unit: string;
    };
    feelsLike: {
      celsius: number;
      fahrenheit: number;
      unit: string;
    };
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    humidity: number;
    cloud: number;
    windSpeed: {
      kph: number;
      mph: number;
      unit: string;
    };
    windDirection: number;
    windDir: string;
    pressure: {
      mb: number;
      in: number;
      unit: string;
    };
    precipitation: {
      mm: number;
      in: number;
      unit: string;
    };
    uv: number;
    visibility: {
      km: number;
      miles: number;
      unit: string;
    };
  };
  forecast?: Array<{
    date: string;
    day: {
      maxTemp: { celsius: number; fahrenheit: number; unit: string };
      minTemp: { celsius: number; fahrenheit: number; unit: string };
      avgTemp: { celsius: number; fahrenheit: number; unit: string };
      condition: { text: string; icon: string; code: number };
      maxWindSpeed: { kph: number; mph: number; unit: string };
      totalPrecipitation: { mm: number; in: number; unit: string };
      avgHumidity: number;
      avgVisibility: { km: number; miles: number; unit: string };
      uv: number;
    };
    astro: {
      sunrise: string;
      sunset: string;
      moonrise: string;
      moonset: string;
      moonPhase: string;
      moonIllumination: string;
    };
    hours: Array<{
      time: string;
      temperature: { celsius: number; fahrenheit: number; unit: string };
      condition: { text: string; icon: string; code: number };
      windSpeed: { kph: number; mph: number; unit: string };
      windDirection: number;
      pressure: { mb: number; in: number; unit: string };
      precipitation: { mm: number; in: number; unit: string };
      humidity: number;
      cloud: number;
      feelsLike: { celsius: number; fahrenheit: number; unit: string };
      visibility: { km: number; miles: number; unit: string };
      uv: number;
    }>;
  }>;
  alerts?: Array<{
    headline: string;
    msgtype: string;
    severity: string;
    urgency: string;
    areas: string;
    category: string;
    certainty: string;
    event: string;
    note: string;
    effective: string;
    expires: string;
    desc: string;
    instruction: string;
  }>;
  units: string;
}

export interface TestIntegrationResponse {
  success: boolean;
  data?: WeatherData;
  settings: Record<string, any>;
  timestamp: string;
}

class IntegrationsService {
  // Integration Catalog APIs
  async getCatalog(): Promise<ApiResponse<IntegrationAppItem[]>> {
    const response = await api.get('/integrations/catalog');
    // Handle both single item and array responses
    const data = response.data.data;
    if (Array.isArray(data)) {
      return response.data;
    } else {
      // Convert single item to array
      return {
        ...response.data,
        data: [data]
      };
    }
  }

  // Account Integration Management APIs
  async createAccountIntegration(
    integrationAppId: number,
    settings?: IntegrationSettingItem[]
  ): Promise<ApiResponse<AccountIntegrationItem>> {
    const response = await api.post('/account-integrations', {
      integrationAppId,
      settings: settings || []
    });
    return response.data;
  }

  async getAccountIntegrations(params?: {
    page?: number;
    limit?: number;
    status?: IntegrationStatus;
  }): Promise<ApiResponse<AccountIntegrationsResponse>> {
    const response = await api.get('/integrations/catalog');
    return response.data;
  }

  async getAccountIntegrationById(id: number): Promise<ApiResponse<AccountIntegrationItem>> {
    const response = await api.get(`/account-integrations/${id}`);
    return response.data;
  }

  async updateIntegrationSettings(
    id: number,
    settings: IntegrationSettingItem[]
  ): Promise<ApiResponse<AccountIntegrationItem>> {
    const response = await api.patch(`/account-integrations/${id}/settings`, { settings });
    return response.data;
  }

  async deleteAccountIntegration(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete(`/account-integrations/${id}`);
    return response.data;
  }

  // OAuth Authentication APIs
  async startOAuthFlow(
    provider: string,
    integrationAppId: number,
    redirectUri?: string
  ): Promise<ApiResponse<{ authUrl: string; state: string; provider: string }>> {
    const params: any = { integrationAppId };
    if (redirectUri) params.redirectUri = redirectUri;
    
    const response = await api.get(`/integrations/auth/${provider}/login`, { params });
    return response.data;
  }

  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
    error?: string
  ): Promise<ApiResponse<{ success: boolean; integrationId?: number; provider: string }>> {
    const params: any = { code, state };
    if (error) params.error = error;
    
    const response = await api.get(`/integrations/auth/${provider}/callback`, { params });
    return response.data;
  }

  // Testing and Data APIs
  async testIntegration(id: number): Promise<ApiResponse<TestIntegrationResponse>> {
    const response = await api.post(`/account-integrations/${id}/test`);
    return response.data;
  }

  async getWeatherData(
    id: number,
    type: 'current' | 'forecast' | 'alerts'
  ): Promise<ApiResponse<WeatherData>> {
    const response = await api.get(`/account-integrations/${id}/weather`, {
      params: { type }
    });
    return response.data;
  }
}

export default new IntegrationsService();
