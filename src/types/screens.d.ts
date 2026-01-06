export type ScreenStatus = 'active' | 'inactive' | 'maintenance' | 'paired';

export type Screen = {
  id: string | number;
  name: string;
  macAddress: string;
  deviceFingerprint?: string | null;
  status: ScreenStatus | string;
  isOnline: boolean;
  lastSeenAt: string | null;
  pairedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  account: string | number;
  brand: string | number | null;
  // Legacy fields for backward compatibility
  accountId?: number;
  brandId?: number | null;
  deviceName?: string;
};

export type ScreenPairingCode = {
  id: number;
  account: number;
  pairingCode: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled' | 'failed';
  expiresAt: string;
  createdAt: string;
  usedAt?: string | null;
  createdByUserAccount?: number;
};

export type GeneratePairingCodeRequest = {
  accountId: number;
  expiryMinutes?: number;
};

export type PairingCodeStatus = {
  id: number;
  pairingCode: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled' | 'failed';
  expiresAt: string;
  createdAt: string;
  usedAt?: string | null;
};

export type PairWithCodeRequest = {
  pairingCode: string;
  deviceInfo: {
    macAddress: string;
    deviceFingerprint: string;
    deviceName?: string;
  };
};

export type PairWithCodeResponse = {
  screen: Screen;
  authToken: {
    token: string;
    expiresAt: string;
  };
};

export type ScreenContentType = 'playlist' | 'file' | 'integration';

export type ScreenContent = {
  id: number;
  screenId: number;
  contentType: ScreenContentType;
  playlistId?: number;
  fileId?: number;
  integrationId?: number;
  playlist?: {
    id: number;
    name: string;
    duration: number;
  };
  isDefault: boolean;
  priority: number;
  createdAt: string;
};

export type CurrentScreenContent = {
  hasContent: boolean;
  content?: {
    screenContentId: number;
    fileId: number;
    file: {
      id: number;
      name: string;
      originalFilename: string;
      contentType: string;
      fileSize: number;
      url: string;
      metadata: {
        originalName: string;
        uploadedAt: string;
        storageProvider: string;
      };
    };
    assignedAt: string;
    updatedAt: string;
  };
  message?: string;
};

export type ScreenSchedule = {
  id: number;
  screenId: number;
  screenContentId: number;
  startTime: string;
  endTime: string;
  priority: number;
  isRecurring: boolean;
  recurrencePattern?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type ScreenEvent = {
  id: number;
  screenId: number;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ScreenEventStats = {
  total: number;
  byType: Record<string, number>;
};

export type PlaybackInstructions = {
  screen: {
    id: number;
    name: string;
    status: ScreenStatus;
  };
  content: {
    type: ScreenContentType;
    playlistId?: number;
    fileId?: number;
    integrationId?: number;
    playlist?: {
      id: number;
      name: string;
      duration: number;
    };
  };
  schedules: Array<{
    id: number;
    screenContentId: number;
    startTime: string;
    endTime: string;
    priority: number;
  }>;
};

export type HeartbeatRequest = {
  isOnline: boolean;
  metrics?: {
    cpu?: number;
    memory?: number;
    storage?: number;
    temperature?: number;
  };
};

export type HeartbeatResponse = {
  message: string;
  timestamp: string;
};

export type PairingRequest = {
  pairingCode: string;
  macAddress: string;
  deviceName: string;
};

export type PairingResponse = {
  token: string;
  screen: Screen;
};

export type CreatePairingCodeRequest = {
  expiresInMinutes?: number;
};

export type UpdateScreenRequest = {
  name?: string;
  brandId?: number;
  status?: ScreenStatus;
};

export type AssignContentRequest = {
  contentType: ScreenContentType;
  playlistId?: number;
  fileId?: number;
  integrationId?: number;
  isDefault?: boolean;
  priority?: number;
};

export type CreateScheduleRequest = {
  screenContentId: number;
  startTime: string;
  endTime: string;
  priority: number;
  isRecurring?: boolean;
  recurrencePattern?: string | null;
};

export type LogEventRequest = {
  eventType: string;
  metadata: Record<string, unknown>;
};

export type LogEventResponse = {
  message: string;
  eventId: number;
};

export type ListScreensParams = {
  status?: ScreenStatus | string;
  brandId?: number;
};

export type ListSchedulesParams = {
  isActive?: boolean;
};

export type ListEventsParams = {
  eventType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
};

export type EventStatsParams = {
  startDate?: string;
  endDate?: string;
};

