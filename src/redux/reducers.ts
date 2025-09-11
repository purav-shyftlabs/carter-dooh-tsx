import { REDUX_ACTION } from '@/types/common';
import { AuthUser } from '@/types';
import * as types from './types';

export interface IAuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface IRootState {
  auth: IAuthState;
}

export const AUTH_INITIAL_STATE: IAuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: IAuthState = AUTH_INITIAL_STATE, action: REDUX_ACTION): IAuthState => {
  switch (action.type) {
    case types.AUTH_LOGIN_REQUEST:
      return { ...state, isLoading: true, error: null };
    case types.AUTH_LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user ?? state.user,
        token: action.payload.token ?? state.token,
        refreshToken: action.payload.refreshToken ?? state.refreshToken,
        error: null,
      };
    case types.AUTH_LOGIN_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    case types.AUTH_LOGOUT:
      return { ...AUTH_INITIAL_STATE };
    case types.AUTH_SET_USER:
      return { ...state, user: action.payload };
    case types.AUTH_CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

const reducers = (state: IRootState | undefined, action: REDUX_ACTION) => {
  return {
    auth: authReducer(state?.auth, action),
  } as IRootState;
};

export default reducers;
