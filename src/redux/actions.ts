import { Dispatch } from 'redux';
import { AuthUser } from '@/types';
import * as types from './types';
import authService from '@/services/auth/auth-service';
import DashboardService from '@/services/dashboard/dashboard.service';
import { initializeStore } from './store';

export const authClearError = () => ({ type: types.AUTH_CLEAR_ERROR });
export const authSetUser = (user: AuthUser) => ({ type: types.AUTH_SET_USER, payload: user });
const store = initializeStore();

// Alert actions
export const removeAlert = (id: string) => ({ type: 'REMOVE_ALERT', payload: id });

export const login = (credentials: { email: string; password: string }) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: types.AUTH_LOGIN_REQUEST });
    const result = await authService.login(credentials);
    const envelope: unknown = (result && typeof result === 'object' && 'data' in (result as Record<string, unknown>))
      ? (result as Record<string, unknown>)['data']
      : result;
    const payload = {
      user: (envelope as Record<string, unknown>)?.user ?? (result as Record<string, unknown>)?.user ?? null,
      token:
        (envelope as Record<string, unknown>)?.token ??
        (result as Record<string, unknown>)?.token ??
        (envelope as Record<string, unknown>)?.accessToken ??
        null,
      refreshToken:
        (envelope as Record<string, unknown>)?.refreshToken ??
        (result as Record<string, unknown>)?.refreshToken ??
        null,
    } as { user: unknown; token: string | null; refreshToken: string | null };
    if (typeof window !== 'undefined') {
      payload.token && localStorage.setItem('token', payload.token);
      payload.refreshToken && localStorage.setItem('refreshToken', payload.refreshToken);
      payload.user && localStorage.setItem('user', JSON.stringify(payload.user));
    }
    dispatch({ type: types.AUTH_LOGIN_SUCCESS, payload });

    // After login, fetch /users/me and store in redux
    try {
      // Clear any stale user before refetching
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      dispatch({ type: types.AUTH_SET_USER, payload: null });

      const me = await authService.getMe();
      if (me && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(me));
      }
      dispatch({ type: types.AUTH_SET_USER, payload: me as AuthUser });
    } catch (_e) {
      // Non-blocking: keep auth state even if /users/me fails
    }
    return payload;
  } catch (err) {
    console.error('Login action error:', err);
    const message =  (err as { message?: string }).message as string;
    dispatch({ type: types.AUTH_LOGIN_FAILURE, payload: message });
    throw new Error(message);
  }
};

export const toggleSidebar = () => ({ type: types.TOGGLE_SIDEBAR });
export const setSidebarOpen = (open: boolean) => ({ type: types.SET_SIDEBAR_OPEN, payload: open });
export const toggleNotificationDrawer = () => ({ type: types.TOGGLE_NOTIFICATION_DRAWER });
export const setNotificationDrawerOpen = (open: boolean) => ({ type: types.SET_NOTIFICATION_DRAWER_OPEN, payload: open });

// Upcoming Schedules actions
export const setUpcomingSchedules = (schedules: Array<Record<string, unknown>>) => ({ 
  type: types.SET_UPCOMING_SCHEDULES, 
  payload: schedules 
});

// Forgot password action
export const forgotPassword = (email: string) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: types.AUTH_FORGOT_PASSWORD_REQUEST });
    await authService.forgotPassword(email);
    dispatch({ type: types.AUTH_FORGOT_PASSWORD_SUCCESS });
    return true;
  } catch (error) {
    console.error('Forgot password error:', error);
    const message = (error as { message?: string }).message || 'Failed to send reset email';
    dispatch({ type: types.AUTH_FORGOT_PASSWORD_FAILURE, payload: message });
    throw error;
  }
};

export const logout = () => async (dispatch: Dispatch) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
  dispatch({ type: types.AUTH_LOGOUT });
};

// Dashboard actions
export const fetchDashboardData = () => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'DASHBOARD_FETCH_REQUEST' });
    const dashboardService = new DashboardService();
    const data = await dashboardService.getDashboardData();
    dispatch({ type: 'DASHBOARD_FETCH_SUCCESS', payload: data });
    // fan-out to specialized slices
    dispatch({ type: 'RECENT_ACTIVITY_FETCH_SUCCESS', payload: data.recentActivity ?? [] });
    dispatch({ type: 'UPCOMING_SCHEDULES_FETCH_SUCCESS', payload: data.upcomingSchedules ?? [] });
    dispatch(setUpcomingSchedules(data.upcomingSchedules ?? []));
    return data;
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    const message = (error as { message?: string }).message || 'Failed to fetch dashboard data';
    dispatch({ type: 'DASHBOARD_FETCH_FAILURE', payload: message });
    dispatch({ type: 'RECENT_ACTIVITY_FETCH_FAILURE', payload: message });
    dispatch({ type: 'UPCOMING_SCHEDULES_FETCH_FAILURE', payload: message });
    throw error;
  }
};

