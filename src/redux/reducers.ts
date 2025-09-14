import { REDUX_ACTION } from '@/types/common';
import { AuthUser } from '@/types';
import { SnackbarVariant } from 'shyftlabs-dsl';
import { DashboardData } from '@/services/dashboard/dashboard.service';
import * as types from './types';

export interface IAuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isForgotPasswordLoading: boolean;
}

export interface ICommonState {
  alerts: Array<{ id: string; message: string; variant: SnackbarVariant }>;
  message?: string | null;
}

export interface IDashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

export interface ILayoutState {
  sidebarOpen: boolean;
  isNotificationDrawerOpen?: boolean;
}

export interface IRootState {
  auth: IAuthState;
  common: ICommonState;
  dashboard: IDashboardState;
  layout: ILayoutState;
  recentActivity: IRecentActivityState;
  upcomingSchedules: IUpcomingSchedulesState;
}

export const AUTH_INITIAL_STATE: IAuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isForgotPasswordLoading: false,
};

export const COMMON_INITIAL_STATE: ICommonState = {
  alerts: [],
  message: null,
};

export const DASHBOARD_INITIAL_STATE: IDashboardState = {
  data: null,
  isLoading: false,
  error: null,
};

export const LAYOUT_INITIAL_STATE: ILayoutState = {
  sidebarOpen: false,
  isNotificationDrawerOpen: false,
};

export interface IRecentActivityState {
  items: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: string | null;
}

export interface IUpcomingSchedulesState {
  items: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: string | null;
}

export const RECENT_ACTIVITY_INITIAL_STATE: IRecentActivityState = {
  items: [],
  isLoading: false,
  error: null,
};

export const UPCOMING_SCHEDULES_INITIAL_STATE: IUpcomingSchedulesState = {
  items: [],
  isLoading: false,
  error: null,
};

const authReducer = (state: IAuthState = AUTH_INITIAL_STATE, action: REDUX_ACTION): IAuthState => {
  switch (action.type) {
    case types.AUTH_LOGIN_REQUEST:
      return { ...state, isLoading: true, error: null };
    case types.AUTH_LOGIN_SUCCESS:
      {
        const payload = (action.payload ?? {}) as {
          user?: AuthUser | null;
          token?: string | null;
          refreshToken?: string | null;
        };
        return {
          ...state,
          isLoading: false,
          isAuthenticated: true,
          user: payload.user ?? state.user,
          token: payload.token ?? state.token,
          refreshToken: payload.refreshToken ?? state.refreshToken,
          error: null,
        };
      }
    case types.AUTH_LOGIN_FAILURE:
      return { ...state, isLoading: false, error: String(action.payload ?? 'Login failed') };
    case types.AUTH_LOGOUT:
      return { ...AUTH_INITIAL_STATE };
    case types.AUTH_SET_USER:
      return { ...state, user: (action.payload ?? null) as AuthUser | null };
    case types.AUTH_CLEAR_ERROR:
      return { ...state, error: null };
    case types.AUTH_FORGOT_PASSWORD_REQUEST:
      return { ...state, isForgotPasswordLoading: true, error: null };
    case types.AUTH_FORGOT_PASSWORD_SUCCESS:
      return { ...state, isForgotPasswordLoading: false, error: null };
    case types.AUTH_FORGOT_PASSWORD_FAILURE:
      return { ...state, isForgotPasswordLoading: false, error: String(action.payload ?? 'Failed to send reset email') };
    default:
      return state;
  }
};

const commonReducer = (state: ICommonState = COMMON_INITIAL_STATE, action: REDUX_ACTION): ICommonState => {
  switch (action.type) {
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload),
      };
    default:
      return state;
  }
};

const dashboardReducer = (state: IDashboardState = DASHBOARD_INITIAL_STATE, action: REDUX_ACTION): IDashboardState => {
  switch (action.type) {
    case 'DASHBOARD_FETCH_REQUEST':
      return { ...state, isLoading: true, error: null };
    case 'DASHBOARD_FETCH_SUCCESS':
      return { ...state, isLoading: false, data: action.payload as DashboardData, error: null };
    case 'DASHBOARD_FETCH_FAILURE':
      return { ...state, isLoading: false, error: String(action.payload ?? 'Failed to fetch dashboard data') };
    default:
      return state;
  }
};

const layoutReducer = (state: ILayoutState = LAYOUT_INITIAL_STATE, action: REDUX_ACTION): ILayoutState => {
  switch (action.type) {
    case types.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case types.SET_SIDEBAR_OPEN:
      return { ...state, sidebarOpen: Boolean(action.payload) };
    case types.TOGGLE_NOTIFICATION_DRAWER:
      return { ...state, isNotificationDrawerOpen: !state.isNotificationDrawerOpen };
    case types.SET_NOTIFICATION_DRAWER_OPEN:
      return { ...state, isNotificationDrawerOpen: Boolean(action.payload) };
    default:
      return state;
  }
};

const recentActivityReducer = (
  state: IRecentActivityState = RECENT_ACTIVITY_INITIAL_STATE,
  action: REDUX_ACTION,
): IRecentActivityState => {
  switch (action.type) {
    case 'RECENT_ACTIVITY_FETCH_REQUEST':
      return { ...state, isLoading: true, error: null };
    case 'RECENT_ACTIVITY_FETCH_SUCCESS':
      return { ...state, isLoading: false, items: (action.payload as Array<Record<string, unknown>>) ?? [], error: null };
    case 'RECENT_ACTIVITY_FETCH_FAILURE':
      return { ...state, isLoading: false, error: String(action.payload ?? 'Failed to fetch recent activity') };
    default:
      return state;
  }
};

const upcomingSchedulesReducer = (
  state: IUpcomingSchedulesState = UPCOMING_SCHEDULES_INITIAL_STATE,
  action: REDUX_ACTION,
): IUpcomingSchedulesState => {
  switch (action.type) {
    case types.UPCOMING_SCHEDULES_FETCH_REQUEST:
      return { ...state, isLoading: true, error: null };
    case types.UPCOMING_SCHEDULES_FETCH_SUCCESS:
      return { ...state, isLoading: false, items: (action.payload as Array<Record<string, unknown>>) ?? [], error: null };
    case types.UPCOMING_SCHEDULES_FETCH_FAILURE:
      return { ...state, isLoading: false, error: String(action.payload ?? 'Failed to fetch upcoming schedules') };
    case types.SET_UPCOMING_SCHEDULES:
      return { ...state, items: (action.payload as Array<Record<string, unknown>>) ?? [] };
    default:
      return state;
  }
};

const reducers = (state: IRootState | undefined, action: REDUX_ACTION) => {
  return {
    auth: authReducer(state?.auth, action),
    common: commonReducer(state?.common, action),
    dashboard: dashboardReducer(state?.dashboard, action),
    layout: layoutReducer(state?.layout, action),
    recentActivity: recentActivityReducer(state?.recentActivity, action),
    upcomingSchedules: upcomingSchedulesReducer(state?.upcomingSchedules, action),
  } as IRootState;
};

export default reducers;
