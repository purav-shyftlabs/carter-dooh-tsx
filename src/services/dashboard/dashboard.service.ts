import api from '../api/api-client';

export interface DashboardData {
  billboards: {
    active: number;
    growthFromLastMonth: number;
  };
  schedules: {
    upcomingIn24h: number;
  };
  content: {
    total: number;
    uploadedLastWeek: number;
    weeklyGrowth: number;
  };
  users: {
    online: number;
  };
  recentActivity?: Array<Record<string, unknown>>;
  upcomingSchedules?: Array<Record<string, unknown>>;
}

export interface DashboardResponse {
  message: string;
  data: DashboardData;
}

class DashboardService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
  }

  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await api.get('/api/dashboard');
      return response.data.data as DashboardData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

export default DashboardService;
