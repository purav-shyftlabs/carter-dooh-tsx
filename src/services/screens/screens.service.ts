import api from '../api/api-client';
import type {
  Screen,
  ScreenPairingCode,
  ScreenContent,
  ScreenSchedule,
  ScreenEvent,
  ScreenEventStats,
  PlaybackInstructions,
  HeartbeatRequest,
  HeartbeatResponse,
  PairingRequest,
  PairingResponse,
  CreatePairingCodeRequest,
  UpdateScreenRequest,
  AssignContentRequest,
  CreateScheduleRequest,
  LogEventRequest,
  LogEventResponse,
  ListScreensParams,
  ListSchedulesParams,
  ListEventsParams,
  EventStatsParams,
  GeneratePairingCodeRequest,
  PairingCodeStatus,
  PairWithCodeRequest,
  PairWithCodeResponse,
  CurrentScreenContent,
} from '@/types/screens';

class ScreensService {
  private baseUrl = '/api/screens';
  private playerBaseUrl = '/api/player';
  private screenContentUrl = '/api/screen-content';
  private screenScheduleUrl = '/api/screen-schedule';

  // ==================== Screen Pairing APIs ====================

  /**
   * Generate Pairing Code
   * POST /api/screens/pairing/generate-code
   */
  async generatePairingCode(params: GeneratePairingCodeRequest): Promise<ScreenPairingCode> {
    try {
      console.log('Generating pairing code with params:', params);
      const response = await api.post(`${this.baseUrl}/pairing/generate-code`, params);
      console.log('Pairing code generated:', response.data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error generating pairing code:', error);
      throw error;
    }
  }

  /**
   * Get Pairing Code Status
   * GET /api/screens/pairing/code-status/:codeId
   */
  async getPairingCodeStatus(codeId: number | string): Promise<PairingCodeStatus> {
    try {
      const response = await api.get(`${this.baseUrl}/pairing/code-status/${codeId}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error getting pairing code status:', error);
      throw error;
    }
  }

  /**
   * Cancel Pairing Code
   * POST /api/screens/pairing/cancel-code/:codeId
   */
  async cancelPairingCode(codeId: number | string): Promise<{ message: string }> {
    try {
      const response = await api.post(`${this.baseUrl}/pairing/cancel-code/${codeId}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error cancelling pairing code:', error);
      throw error;
    }
  }

  /**
   * Pair Screen with Code (Web Player)
   * POST /api/screens/pairing/pair-with-code
   */
  async pairWithCode(payload: PairWithCodeRequest): Promise<PairWithCodeResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/pairing/pair-with-code`, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error pairing with code:', error);
      throw error;
    }
  }

  /**
   * Pair Screen
   * POST /api/player/pair
   */
  async pairScreen(payload: PairingRequest): Promise<PairingResponse> {
    try {
      const response = await api.post(`${this.playerBaseUrl}/pair`, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error pairing screen:', error);
      throw error;
    }
  }

  // ==================== Screen Management APIs ====================

  /**
   * List Screens
   * GET /api/screens
   */
  async listScreens(params?: ListScreensParams): Promise<Screen[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', String(params.status));
      if (params?.brandId) queryParams.append('brandId', params.brandId.toString());

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
      console.log('Fetching screens from:', url);
      const response = await api.get(url);
      console.log('Screens API response:', response.data);
      
      // Handle different response structures
      // Case 1: Direct array response
      if (Array.isArray(response.data)) {
        console.log('Returning array response:', response.data.length, 'screens');
        return response.data;
      }
      
      // Case 2: Wrapped in data property
      if (response.data?.data) {
        if (Array.isArray(response.data.data)) {
          console.log('Returning wrapped array response:', response.data.data.length, 'screens');
          return response.data.data;
        }
        // If data.data is an object with items array
        if (response.data.data.items && Array.isArray(response.data.data.items)) {
          console.log('Returning items array response:', response.data.data.items.length, 'screens');
          return response.data.data.items;
        }
      }
      
      // Case 3: Response has items property
      if (response.data?.items && Array.isArray(response.data.items)) {
        console.log('Returning items response:', response.data.items.length, 'screens');
        return response.data.items;
      }
      
      console.warn('Unexpected response structure, returning empty array');
      return [];
    } catch (error) {
      console.error('Error listing screens:', error);
      // Log more details about the error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Error status:', axiosError.response?.status);
        console.error('Error data:', axiosError.response?.data);
      }
      throw error;
    }
  }

  /**
   * Get Screen by ID
   * GET /api/screens/:id
   */
  async getScreenById(id: number | string): Promise<Screen> {
    try {
      console.log('Fetching screen by ID:', id);
      const response = await api.get(`${this.baseUrl}/${id}`);
      console.log('Screen by ID response:', response.data);
      
      // Handle different response structures
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching screen:', error);
      // Log more details about the error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Error status:', axiosError.response?.status);
        console.error('Error data:', axiosError.response?.data);
      }
      throw error;
    }
  }

  /**
   * Update Screen
   * PUT /api/screens/:id
   */
  async updateScreen(id: number | string, payload: UpdateScreenRequest): Promise<Screen> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error updating screen:', error);
      throw error;
    }
  }

  /**
   * Delete Screen
   * DELETE /api/screens/:id
   */
  async deleteScreen(id: number | string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error deleting screen:', error);
      throw error;
    }
  }

  // ==================== Screen Content APIs ====================

  /**
   * Assign Content to Screen
   * POST /api/screens/:screenId/content
   */
  async assignContent(screenId: number | string, payload: AssignContentRequest): Promise<ScreenContent> {
    try {
      const response = await api.post(`${this.baseUrl}/${screenId}/content`, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error assigning content:', error);
      throw error;
    }
  }

  /**
   * List Screen Content
   * GET /api/screens/:screenId/content
   */
  async listScreenContent(screenId: number | string): Promise<ScreenContent[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${screenId}/content`);
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error listing screen content:', error);
      throw error;
    }
  }

  /**
   * Remove Screen Content
   * DELETE /api/screen-content/:id
   */
  async removeScreenContent(id: number | string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`${this.screenContentUrl}/${id}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error removing screen content:', error);
      throw error;
    }
  }

  // ==================== Screen Schedule APIs ====================

  /**
   * Create Schedule
   * POST /api/screens/:screenId/schedule
   */
  async createSchedule(screenId: number | string, payload: CreateScheduleRequest): Promise<ScreenSchedule> {
    try {
      const response = await api.post(`${this.baseUrl}/${screenId}/schedule`, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * List Schedules
   * GET /api/screens/:screenId/schedule
   */
  async listSchedules(screenId: number | string, params?: ListSchedulesParams): Promise<ScreenSchedule[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const url = queryParams.toString() 
        ? `${this.baseUrl}/${screenId}/schedule?${queryParams.toString()}` 
        : `${this.baseUrl}/${screenId}/schedule`;
      const response = await api.get(url);
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error listing schedules:', error);
      throw error;
    }
  }

  /**
   * Get Active Schedules
   * GET /api/screens/:screenId/schedule/active
   */
  async getActiveSchedules(screenId: number | string): Promise<ScreenSchedule[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${screenId}/schedule/active`);
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error getting active schedules:', error);
      throw error;
    }
  }

  /**
   * Delete Schedule
   * DELETE /api/screen-schedule/:id
   */
  async deleteSchedule(id: number | string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`${this.screenScheduleUrl}/${id}`);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  // ==================== Player Sync APIs ====================

  /**
   * Get Playback Instructions
   * GET /api/player/sync
   * Note: This endpoint uses Screen Token authentication (not JWT)
   */
  async getPlaybackInstructions(token?: string): Promise<PlaybackInstructions> {
    try {
      // Create a separate axios instance for player APIs that use screen tokens
      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {};
      const response = await api.get(`${this.playerBaseUrl}/sync`, config);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error getting playback instructions:', error);
      throw error;
    }
  }

  /**
   * Heartbeat
   * POST /api/player/heartbeat
   * Note: This endpoint uses Screen Token authentication (not JWT)
   */
  async sendHeartbeat(payload: HeartbeatRequest, token?: string): Promise<HeartbeatResponse> {
    try {
      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {};
      const response = await api.post(`${this.playerBaseUrl}/heartbeat`, payload, config);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      throw error;
    }
  }

  // ==================== Push Content APIs ====================

  /**
   * Push Content to Screen (Realtime Display)
   * POST /api/screens/:screenId/realtime/display
   */
  async pushContentToScreen(
    screenId: number | string,
    fileId?: number,
    playlistId?: number
  ): Promise<{
    success: boolean;
    screenId: number;
    screenContentId: number;
    message: string;
  }> {
    try {
      const payload: { fileId?: number; playlistId?: number } = {};
      if (fileId) {
        payload.fileId = fileId;
      }
      if (playlistId) {
        payload.playlistId = playlistId;
      }
      const response = await api.post(`${this.baseUrl}/${screenId}/realtime/display`, payload);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error pushing content to screen:', error);
      throw error;
    }
  }

  /**
   * Get Current Content for Screen (Portal)
   * GET /api/screens/:screenId/realtime/content
   * Note: This is a portal endpoint. For player API, use GET /api/player/content with screen token.
   */
  async getCurrentScreenContent(screenId: number | string): Promise<CurrentScreenContent> {
    try {
      console.log('Getting current content for screen:', screenId);
      const response = await api.get(`${this.baseUrl}/${screenId}/realtime/content`);
      console.log('Current content response:', response.data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error getting current screen content:', error);
      // If endpoint returns 404 or no content, return empty response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        if (axiosError.response?.status === 404) {
          return {
            hasContent: false,
            message: 'No content assigned',
          };
        }
      }
      throw error;
    }
  }

  // ==================== Screen Event APIs ====================

  /**
   * Log Event
   * POST /api/player/event
   * Note: This endpoint uses Screen Token authentication (not JWT)
   */
  async logEvent(payload: LogEventRequest, token?: string): Promise<LogEventResponse> {
    try {
      const config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {};
      const response = await api.post(`${this.playerBaseUrl}/event`, payload, config);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error logging event:', error);
      throw error;
    }
  }

  /**
   * Get Screen Events
   * GET /api/screens/:screenId/events
   */
  async getScreenEvents(screenId: number | string, params?: ListEventsParams): Promise<ScreenEvent[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.eventType) queryParams.append('eventType', params.eventType);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());

      const url = queryParams.toString()
        ? `${this.baseUrl}/${screenId}/events?${queryParams.toString()}`
        : `${this.baseUrl}/${screenId}/events`;
      const response = await api.get(url);
      return response.data?.data ?? response.data ?? [];
    } catch (error) {
      console.error('Error getting screen events:', error);
      throw error;
    }
  }

  /**
   * Get Event Statistics
   * GET /api/screens/:screenId/events/stats
   */
  async getEventStatistics(screenId: number | string, params?: EventStatsParams): Promise<ScreenEventStats> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const url = queryParams.toString()
        ? `${this.baseUrl}/${screenId}/events/stats?${queryParams.toString()}`
        : `${this.baseUrl}/${screenId}/events/stats`;
      const response = await api.get(url);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error getting event statistics:', error);
      throw error;
    }
  }
}

export const screensService = new ScreensService();
export default ScreensService;

