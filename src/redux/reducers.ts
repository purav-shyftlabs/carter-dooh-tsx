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
}

export interface IRootState {
  auth: IAuthState;
  common: ICommonState;
  dashboard: IDashboardState;
  layout: ILayoutState;
}

export const AUTH_INITIAL_STATE: IAuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
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
  } as IRootState;
};

export default reducers;
